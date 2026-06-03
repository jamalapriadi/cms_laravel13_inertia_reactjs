<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Customer\ForgotCustomerPasswordRequest;
use App\Http\Requests\Api\Customer\LoginCustomerRequest;
use App\Http\Requests\Api\Customer\RegisterCustomerRequest;
use App\Http\Requests\Api\Customer\ResetCustomerPasswordRequest;
use App\Http\Resources\Api\V1\CustomerResource;
use App\Models\Shop\Customer;
use App\Models\Shop\CustomerAccessToken;
use App\Services\Api\V1\CartService;
use App\Traits\ApiResponse;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
        description: 'Endpoint untuk register customer frontend Next.js dan mengembalikan bearer token.',
        summary: 'Register customer',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/CustomerRegisterRequest'),
        ),
        tags: ['Customer Authentication'],
        responses: [
            new OA\Response(
                response: 201,
                description: 'Customer registered successfully.',
                content: new OA\JsonContent(ref: '#/components/schemas/CustomerAuthResponse'),
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

        $customer = Customer::create([
            'name' => $validated['name'],
            'email' => Str::lower($validated['email']),
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'is_active' => true,
        ]);

        return $this->authResponse($customer, 'Register berhasil.', 201, $request);
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

        if (! $customer->is_active) {
            return $this->errorResponse('Akun customer Anda belum aktif.', 403);
        }

        $customer->forceFill(['last_login_at' => now()])->save();

        return $this->authResponse($customer, 'Login berhasil.', 200, $request);
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

    protected function authResponse(Customer $customer, string $message, int $status = 200, ?Request $request = null): JsonResponse
    {
        $cart = $request
            ? $this->cartService->mergeGuestCartForCustomer($customer, $request->header('X-Cart-Token'))
            : null;

        return $this->successResponse([
            'customer' => CustomerResource::make($customer)->resolve(),
            'token' => $customer->createAccessToken(),
            'token_type' => 'Bearer',
            'cart' => $cart ? \App\Http\Resources\Api\V1\CartResource::make($cart)->resolve($request) : null,
        ], $message, $status);
    }
}
