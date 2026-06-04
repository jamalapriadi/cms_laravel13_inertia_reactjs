<?php

use App\Services\Cache\ListCacheService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

beforeEach(function () {
    config([
        'cache.default' => 'array',
        'list-cache.enabled' => true,
        'list-cache.default_ttl' => 60,
        'list-cache.taggable_stores' => [],
    ]);

    Cache::flush();
});

test('it reuses cached list data for the same request context', function () {
    $service = app(ListCacheService::class);
    $request = Request::create('/dashboard/ecommerce/products', 'GET', [
        'page' => 1,
        'search' => 'iphone',
    ]);

    $runs = 0;

    $first = $service->rememberRequest('products', $request, function () use (&$runs) {
        $runs++;

        return ['items' => ['first']];
    });

    $second = $service->rememberRequest('products', $request, function () use (&$runs) {
        $runs++;

        return ['items' => ['second']];
    });

    expect($first)->toBe(['items' => ['first']])
        ->and($second)->toBe($first)
        ->and($runs)->toBe(1);
});

test('it separates list cache entries by request parameters', function () {
    $service = app(ListCacheService::class);

    $firstRequest = Request::create('/dashboard/ecommerce/products', 'GET', [
        'page' => 1,
        'search' => 'iphone',
    ]);

    $secondRequest = Request::create('/dashboard/ecommerce/products', 'GET', [
        'page' => 2,
        'search' => 'iphone',
    ]);

    $runs = 0;

    $service->rememberRequest('products', $firstRequest, function () use (&$runs) {
        $runs++;

        return ['page' => 1];
    });

    $second = $service->rememberRequest('products', $secondRequest, function () use (&$runs) {
        $runs++;

        return ['page' => 2];
    });

    expect($second)->toBe(['page' => 2])
        ->and($runs)->toBe(2);
});

test('it clears cached entries for one module without cache tags', function () {
    $service = app(ListCacheService::class);
    $request = Request::create('/dashboard/ecommerce/products', 'GET', ['page' => 1]);

    $runs = 0;

    $service->rememberRequest('products', $request, function () use (&$runs) {
        $runs++;

        return ['version' => 1];
    });

    $service->clear('products');

    $value = $service->rememberRequest('products', $request, function () use (&$runs) {
        $runs++;

        return ['version' => 2];
    });

    expect($value)->toBe(['version' => 2])
        ->and($runs)->toBe(2);
});
