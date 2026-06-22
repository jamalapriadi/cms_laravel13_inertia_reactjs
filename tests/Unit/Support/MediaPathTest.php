<?php

use App\Support\MediaPath;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;

test('media url returns local public url if file exists locally', function () {
    Storage::fake('public');

    // Create a dummy file locally
    Storage::disk('public')->put('products/test-image.jpg', 'content');

    $url = MediaPath::url('products/test-image.jpg');

    expect($url)->toContain('/storage/products/test-image.jpg');
});

test('media url returns S3 url without calling exists on S3 disk when not found locally', function () {
    Storage::fake('public');

    // Mock the idcloudhost disk
    $mockDisk = Mockery::mock(Filesystem::class);
    $mockDisk->shouldReceive('url')
        ->with('products/test-image.jpg')
        ->andReturn('https://s3-mocked/products/test-image.jpg');
    $mockDisk->shouldNotReceive('exists');

    Storage::shouldReceive('disk')->with('public')->andReturn(Storage::disk('public'));
    Storage::shouldReceive('disk')->with('idcloudhost')->andReturn($mockDisk);

    // Mock environment to production
    $originalEnv = app()->environment();
    app()->offsetSet('env', 'production');

    try {
        $url = MediaPath::url('products/test-image.jpg');
        expect($url)->toBe('https://s3-mocked/products/test-image.jpg');
    } finally {
        // Restore environment
        app()->offsetSet('env', $originalEnv);
        Mockery::close();
    }
});
