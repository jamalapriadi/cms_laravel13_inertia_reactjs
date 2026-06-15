<?php

use App\Models\User;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);

$request = Request::create('/my-admin/login', 'GET');
$response = $kernel->handle($request);
$cookies = $response->headers->getCookies();
$sessionCookie = null;
$xsrfToken = null;
foreach ($cookies as $cookie) {
    if ($cookie->getName() === 'gitatrading_session') {
        $sessionCookie = $cookie->getValue();
    }
    if ($cookie->getName() === 'XSRF-TOKEN') {
        $xsrfToken = $cookie->getValue();
    }
}

// Ensure the user exists
$user = User::first();
if (! $user) {
    echo "No user found.\n";
    exit;
}
$email = $user->email;

// Submit POST
$postRequest = Request::create('/my-admin/login', 'POST', [
    'email' => $email,
    'password' => 'password',
]);
$postRequest->headers->set('X-XSRF-TOKEN', $xsrfToken);
$postRequest->cookies->set('gitatrading_session', $sessionCookie);

$postResponse = $kernel->handle($postRequest);

echo 'Status: '.$postResponse->getStatusCode()."\n";
echo 'Redirect: '.$postResponse->headers->get('Location')."\n";
$content = $postResponse->getContent();
if (strpos($content, 'Validation') !== false) {
    echo "Validation error detected in content\n";
}
