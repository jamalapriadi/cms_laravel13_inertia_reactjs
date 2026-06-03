<?php

return [
    'frontend_url' => env('FRONTEND_CUSTOMER_URL', env('APP_URL', 'http://localhost')),
    'api_token_expiration_minutes' => env('CUSTOMER_API_TOKEN_EXPIRATION_MINUTES'),
];
