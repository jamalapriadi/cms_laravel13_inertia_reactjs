<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\ContentEntry;
use App\Models\Dashboard\Language;
use App\Models\Dashboard\Option;
use App\Services\Api\V1\DynamicContentApiService;
use App\Models\ContentType;
use App\Models\CustomFieldGroup;

// Clean DB
Illuminate\Support\Facades\Artisan::call('migrate:fresh');

$language = Language::query()->create([
    'code' => 'id',
    'name' => 'Indonesian',
    'english_name' => 'Indonesian',
    'default_locale' => 'id_ID',
]);

Option::query()->updateOrCreate(['key' => 'languages'], ['value' => ['en', 'id']]);
Option::query()->updateOrCreate(['key' => 'default_language'], ['value' => 'en']);

$contentType = ContentType::query()->create([
    'name' => 'Testimonials',
    'slug' => 'testimonials',
    'is_active' => true,
    'sort_order' => 1,
]);

$group = CustomFieldGroup::query()->create([
    'name' => 'Testimonial Fields',
    'slug' => 'testimonial-fields',
    'target_type' => 'content_type',
    'target_id' => $contentType->id,
    'is_active' => true,
    'sort_order' => 1,
]);

$group->fields()->create([
    'label' => 'Customer Name',
    'name' => 'customer_name',
    'type' => 'text',
    'is_active' => true,
    'sort_order' => 1,
]);

$entry = ContentEntry::query()->create([
    'content_type_id' => $contentType->id,
    'title' => 'English Testimonial',
    'slug' => 'english-testimonial',
    'status' => 'published',
    'data' => [
        'customer_name' => 'John Doe',
    ],
]);

$entry->translations()->create([
    'language_id' => $language->id,
    'title' => 'Testimoni Indonesia',
    'slug' => 'testimoni-indonesia',
    'status' => 'published',
    'data' => [
        'customer_name' => 'Budi Santoso',
    ],
]);

$service = app(DynamicContentApiService::class);
$paginator = $service->paginatePublishedEntries($contentType, [], 'id');

$resolvedEntry = $paginator->getCollection()->first();
echo "Title: " . $resolvedEntry->title . "\n";
echo "Customer Name: " . ($resolvedEntry->data['customer_name'] ?? 'NULL') . "\n";
