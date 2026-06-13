<?php

namespace App\Models\Shop;

use App\Notifications\CustomerResetPasswordNotification;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class Customer extends Authenticatable implements MustVerifyEmail
{
    use HasUuids, Notifiable, SoftDeletes;

    protected string $guard = 'customer';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'email_verified_at',
        'is_active',
        'last_login_at',
        'address',
        'metadata',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
            'metadata' => 'array',
            'password' => 'hashed',
        ];
    }

    public function carts()
    {
        return $this->hasMany(Cart::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function accessTokens(): HasMany
    {
        return $this->hasMany(CustomerAccessToken::class);
    }

    public function emailOtps(): HasMany
    {
        return $this->hasMany(CustomerEmailOtp::class);
    }

    public function createAccessToken(string $name = 'customer-api'): string
    {
        $plainTextToken = Str::random(64);
        $expirationMinutes = config('customer.api_token_expiration_minutes');

        $this->accessTokens()->create([
            'name' => $name,
            'token' => hash('sha256', $plainTextToken),
            'expires_at' => $expirationMinutes ? now()->addMinutes((int) $expirationMinutes) : null,
        ]);

        return $plainTextToken;
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new CustomerResetPasswordNotification($token));
    }
}
