<?php

use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Laravel\Sanctum\Http\Middleware\AuthenticateSession;

$appUrlHost = parse_url((string) env('APP_URL', ''), PHP_URL_HOST);

return [

    /*
    |--------------------------------------------------------------------------
    | Stateful Domains
    |--------------------------------------------------------------------------
    |
    | Sanctum is not installed yet. This config is prepared for a future
    | customer API auth setup without changing the existing web guards.
    */

    'stateful' => array_filter(array_map('trim', explode(',', env(
        'SANCTUM_STATEFUL_DOMAINS',
        implode(',', array_filter([
            'localhost',
            'localhost:3000',
            '127.0.0.1',
            '127.0.0.1:8000',
            '::1',
            'gitatrading-store.com',
            'www.gitatrading-store.com',
            'dashboard.gitatrading-store.com',
            'api.gitatrading-store.com',
            $appUrlHost,
        ]))
    )))),

    /*
    |--------------------------------------------------------------------------
    | Guards
    |--------------------------------------------------------------------------
    */

    'guard' => ['web', 'customer'],

    /*
    |--------------------------------------------------------------------------
    | Token Expiration
    |--------------------------------------------------------------------------
    */

    'expiration' => null,

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Middleware
    |--------------------------------------------------------------------------
    */

    'middleware' => [
        'authenticate_session' => AuthenticateSession::class,
        'encrypt_cookies' => EncryptCookies::class,
        'validate_csrf_token' => ValidateCsrfToken::class,
    ],

];
