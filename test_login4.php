<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);

$request = Illuminate\Http\Request::create('/my-admin/login', 'GET');
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

// Submit POST
$postRequest = Illuminate\Http\Request::create('/my-admin/login', 'POST', [
    'email' => 'jamal.apriadi@gmail.com',
    'password' => 'Laravel13',
]);
$postRequest->headers->set('X-XSRF-TOKEN', $xsrfToken);
$postRequest->cookies->set('gitatrading_session', $sessionCookie);

$postResponse = $kernel->handle($postRequest);
$session = $postRequest->getSession();

echo "Status: " . $postResponse->getStatusCode() . "\n";
echo "Redirect: " . $postResponse->headers->get('Location') . "\n";
print_r($session->get('errors'));

