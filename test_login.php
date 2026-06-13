<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = App\Models\User::first();
$response = $app->handle(Illuminate\Http\Request::create('/my-admin/login', 'POST', [
    'email' => $user->email,
    'password' => 'password', // assume default password
]));

echo "Status: " . $response->getStatusCode() . "\n";
echo "Redirect: " . $response->headers->get('Location') . "\n";
