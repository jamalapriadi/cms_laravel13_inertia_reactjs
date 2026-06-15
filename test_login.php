<?php

use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$user = User::first();
$response = $app->handle(Request::create('/my-admin/login', 'POST', [
    'email' => $user->email,
    'password' => 'password', // assume default password
]));

echo 'Status: '.$response->getStatusCode()."\n";
echo 'Redirect: '.$response->headers->get('Location')."\n";
