<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Customer\ForgotCustomerPasswordRequest;
use App\Http\Requests\Api\Customer\LoginCustomerRequest;
use App\Http\Requests\Api\Customer\RegisterCustomerRequest;
use App\Http\Requests\Api\Customer\ResendCustomerOtpRequest;
use App\Http\Requests\Api\Customer\ResetCustomerPasswordRequest;
use App\Http\Requests\Api\Customer\VerifyCustomerOtpRequest;
use App\Http\Resources\Api\V1\CartResource;
use App\Http\Resources\Api\V1\CustomerResource;
use App\Models\Shop\Customer;
use App\Models\Shop\CustomerAccessToken;
use App\Models\Shop\CustomerEmailOtp;
use App\Notifications\CustomerEmailVerificationOtpNotification;
use App\Services\Api\V1\CartService;
use App\Traits\ApiResponse;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;

class CustomerAuthController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly CartService $cartService
    ) {}

    #[OA\Post(
        path: '/api/v1/customer/register',
        description: 'Endpoint untuk register customer frontend Next.js dan mengirim OTP aktivasi akun ke email.',
        summary: 'Register customer',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/CustomerRegisterRequest'),
        ),
        tags: ['Customer Authentication'],
        responses: [
            new OA\Response(
                response: 201,
                description: 'Customer registered and OTP sent successfully.',
                content: new OA\JsonContent(ref: '#/components/schemas/CustomerRegisterOtpResponse'),
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error.',
                content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse'),
            ),
        ],
    )]
    public function register(RegisterCustomerRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $email = Str::lower($validated['email']);

        [$customer, $otp] = DB::transaction(function () use ($validated, $email): array {
            $customer = Customer::create([
                'name' => $validated['name'],
                'email' => $email,
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make($validated['password']),
                'email_verified_at' => null,
                'is_active' => false,
            ]);

            return [$customer, $this->createEmailVerificationOtp($customer)];
        });

        $this->sendEmailVerificationOtp($customer, $otp);

        return $this->successResponse([
            'email' => $customer->email,
            'requires_otp' => true,
        ], 'Registrasi berhasil. Kode OTP telah dikirim ke email untuk aktivasi akun.', 201);
    }

    #[OA\Post(
        path: '/api/v1/customer/login',
        description: 'Endpoint untuk login customer frontend Next.js menggunakan email dan password.',
        summary: 'Login customer',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/CustomerLoginRequest'),
        ),
        tags: ['Customer Authentication'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Customer logged in successfully.',
                content: new OA\JsonContent(ref: '#/components/schemas/CustomerAuthResponse'),
            ),
            new OA\Response(
                response: 401,
                description: 'Invalid credentials.',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiErrorResponse',
                    example: ['success' => false, 'message' => 'Email atau password salah.', 'errors' => []],
                ),
            ),
            new OA\Response(
                response: 403,
                description: 'Customer account is not active yet.',
                content: new OA\JsonContent(ref: '#/components/schemas/CustomerRequiresOtpResponse'),
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error.',
                content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse'),
            ),
        ],
    )]
    public function login(LoginCustomerRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $customer = Customer::query()
            ->where('email', Str::lower($validated['email']))
            ->first();

        if (! $customer || ! Hash::check($validated['password'], $customer->password)) {
            return $this->errorResponse('Email atau password salah.', 401);
        }

        if (! $this->customerCanLogin($customer)) {
            return response()->json([
                'success' => false,
                'message' => 'Akun belum aktif. Silakan verifikasi OTP yang dikirim ke email.',
                'data' => [
                    'email' => $customer->email,
                    'requires_otp' => true,
                ],
            ], 403);
        }

        $customer->forceFill(['last_login_at' => now()])->save();

        return $this->authResponse($customer, 'Login berhasil.', 200, $request);
    }

    #[OA\Post(
        path: '/api/v1/customer/verify-otp',
        description: 'Endpoint untuk verifikasi OTP aktivasi akun customer.',
        summary: 'Verify customer email OTP',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/CustomerVerifyOtpRequest'),
        ),
        tags: ['Customer Authentication'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Customer email OTP verified successfully.',
                content: new OA\JsonContent(ref: '#/components/schemas/CustomerOtpVerifiedResponse'),
            ),
            new OA\Response(
                response: 422,
                description: 'Invalid or expired OTP.',
                content: new OA\JsonContent(ref: '#/components/schemas/ApiErrorResponse'),
            ),
        ],
    )]
    public function verifyOtp(VerifyCustomerOtpRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $email = Str::lower($validated['email']);
        $customer = Customer::query()->where('email', $email)->first();

        if (! $customer) {
            return $this->errorResponse('Kode OTP tidak valid atau sudah kedaluwarsa.', 422);
        }

        $otp = $this->latestPendingEmailVerificationOtp($customer)->first();

        if (! $otp) {
            return $this->errorResponse('Kode OTP tidak valid atau sudah kedaluwarsa.', 422);
        }

        if ($otp->isExpired()) {
            $otp->forceFill(['invalidated_at' => now()])->save();

            return $this->errorResponse('Kode OTP sudah kedaluwarsa. Silakan minta kode baru.', 422);
        }

        if (! Hash::check($validated['otp'], $otp->otp_hash)) {
            return $this->errorResponse('Kode OTP tidak valid.', 422);
        }

        DB::transaction(function () use ($customer, $otp): void {
            $customer->forceFill([
                'email_verified_at' => $customer->email_verified_at ?? now(),
                'is_active' => true,
            ])->save();

            $otp->forceFill(['verified_at' => now()])->save();

            $this->latestPendingEmailVerificationOtp($customer)
                ->whereKeyNot($otp->getKey())
                ->update(['invalidated_at' => now()]);
        });

        return $this->successResponse([
            'email' => $customer->email,
            'is_active' => true,
        ], 'Verifikasi OTP berhasil. Akun Anda sudah aktif.');
    }

    #[OA\Post(
        path: '/api/v1/customer/resend-otp',
        description: 'Endpoint untuk mengirim ulang OTP aktivasi akun customer.',
        summary: 'Resend customer email OTP',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/CustomerResendOtpRequest'),
        ),
        tags: ['Customer Authentication'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Customer email OTP resent successfully.',
                content: new OA\JsonContent(ref: '#/components/schemas/CustomerOtpResentResponse'),
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error.',
                content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse'),
            ),
        ],
    )]
    public function resendOtp(ResendCustomerOtpRequest $request): JsonResponse
    {
        $email = Str::lower($request->validated('email'));
        $customer = Customer::query()->where('email', $email)->first();

        if (! $customer) {
            return $this->errorResponse('Customer tidak ditemukan.', 404);
        }

        if ($this->customerCanLogin($customer)) {
            return $this->successResponse([
                'email' => $customer->email,
                'is_active' => true,
            ], 'Akun customer sudah aktif.');
        }

        $otp = DB::transaction(function () use ($customer): string {
            $this->latestPendingEmailVerificationOtp($customer)
                ->update(['invalidated_at' => now()]);

            return $this->createEmailVerificationOtp($customer);
        });

        $this->sendEmailVerificationOtp($customer, $otp);

        return $this->successResponse([
            'email' => $customer->email,
        ], 'Kode OTP baru telah dikirim ke email Anda.');
    }

    #[OA\Post(
        path: '/api/v1/customer/forgot-password',
        description: 'Endpoint untuk mengirim link reset password ke email customer. Email yang tidak terdaftar tetap mendapat response generic.',
        summary: 'Send reset password link',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/CustomerForgotPasswordRequest'),
        ),
        tags: ['Customer Authentication'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Reset password link accepted.',
                content: new OA\JsonContent(ref: '#/components/schemas/CustomerMessageResponse'),
            ),
            new OA\Response(
                response: 429,
                description: 'Too many reset link requests.',
                content: new OA\JsonContent(ref: '#/components/schemas/ApiErrorResponse'),
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error.',
                content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse'),
            ),
        ],
    )]
    public function forgotPassword(ForgotCustomerPasswordRequest $request): JsonResponse
    {
        $status = Password::broker('customers')->sendResetLink([
            'email' => Str::lower($request->validated('email')),
        ]);

        if ($status === Password::RESET_THROTTLED) {
            return $this->errorResponse(__($status), 429);
        }

        return $this->successResponse(null, 'Link reset password telah dikirim ke email Anda.');
    }

    #[OA\Post(
        path: '/api/v1/customer/reset-password',
        description: 'Endpoint untuk reset password customer menggunakan token valid dari email reset password.',
        summary: 'Reset customer password',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/CustomerResetPasswordRequest'),
        ),
        tags: ['Customer Authentication'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Password reset successfully.',
                content: new OA\JsonContent(ref: '#/components/schemas/CustomerMessageResponse'),
            ),
            new OA\Response(
                response: 422,
                description: 'Invalid or expired reset token.',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiErrorResponse',
                    example: ['success' => false, 'message' => 'Token reset password tidak valid atau sudah kedaluwarsa.', 'errors' => []],
                ),
            ),
        ],
    )]
    public function resetPassword(ResetCustomerPasswordRequest $request): JsonResponse
    {
        $status = Password::broker('customers')->reset(
            $request->validated(),
            function (Customer $customer, string $password): void {
                $customer->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => null,
                ])->save();

                event(new PasswordReset($customer));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            return $this->errorResponse('Token reset password tidak valid atau sudah kedaluwarsa.', 422);
        }

        return $this->successResponse(null, 'Password berhasil direset. Silakan login kembali.');
    }

    #[OA\Get(
        path: '/api/v1/customer/me',
        description: 'Endpoint untuk mengambil data customer yang sedang login menggunakan bearer token.',
        summary: 'Get authenticated customer',
        security: [['bearerAuth' => []]],
        tags: ['Customer Authentication'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Authenticated customer retrieved.',
                content: new OA\JsonContent(ref: '#/components/schemas/CustomerMeResponse'),
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthenticated.',
                content: new OA\JsonContent(ref: '#/components/schemas/ApiErrorResponse'),
            ),
        ],
    )]
    public function me(Request $request): JsonResponse
    {
        return $this->successResponse([
            'customer' => CustomerResource::make($request->user('customer_api'))->resolve($request),
        ]);
    }

    #[OA\Post(
        path: '/api/v1/customer/logout',
        description: 'Endpoint untuk logout customer dengan menghapus bearer token yang sedang digunakan.',
        summary: 'Logout customer',
        security: [['bearerAuth' => []]],
        tags: ['Customer Authentication'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Customer logged out successfully.',
                content: new OA\JsonContent(ref: '#/components/schemas/CustomerMessageResponse'),
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthenticated.',
                content: new OA\JsonContent(ref: '#/components/schemas/ApiErrorResponse'),
            ),
        ],
    )]
    public function logout(Request $request): JsonResponse
    {
        $accessToken = $request->attributes->get('customer_access_token');

        if ($accessToken instanceof CustomerAccessToken) {
            $accessToken->delete();
        }

        return $this->successResponse(null, 'Logout berhasil.');
    }

    protected function customerCanLogin(Customer $customer): bool
    {
        return $customer->is_active && $customer->email_verified_at !== null;
    }

    protected function createEmailVerificationOtp(Customer $customer): string
    {
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $customer->emailOtps()->create([
            'email' => $customer->email,
            'otp_hash' => Hash::make($otp),
            'type' => CustomerEmailOtp::TYPE_EMAIL_VERIFICATION,
            'expires_at' => now()->addMinutes($this->emailVerificationOtpExpirationMinutes()),
        ]);

        return $otp;
    }

    protected function sendEmailVerificationOtp(Customer $customer, string $otp): void
    {
        $customer->notify(new CustomerEmailVerificationOtpNotification(
            $otp,
            $this->emailVerificationOtpExpirationMinutes(),
        ));
    }

    protected function emailVerificationOtpExpirationMinutes(): int
    {
        return (int) config('customer.email_verification_otp_expiration_minutes', 10);
    }

    /**
     * @return Builder<CustomerEmailOtp>
     */
    protected function latestPendingEmailVerificationOtp(Customer $customer): Builder
    {
        return $customer->emailOtps()
            ->where('type', CustomerEmailOtp::TYPE_EMAIL_VERIFICATION)
            ->whereNull('verified_at')
            ->whereNull('invalidated_at')
            ->latest();
    }

    protected function authResponse(Customer $customer, string $message, int $status = 200, ?Request $request = null): JsonResponse
    {
        $cart = $request
            ? $this->cartService->mergeGuestCartForCustomer($customer, $request->header('X-Cart-Token'))
            : null;

        return $this->successResponse([
            'customer' => CustomerResource::make($customer)->resolve(),
            'token' => $customer->createAccessToken(),
            'token_type' => 'Bearer',
            'cart' => $cart ? CartResource::make($cart)->resolve($request) : null,
        ], $message, $status);
    }
}
