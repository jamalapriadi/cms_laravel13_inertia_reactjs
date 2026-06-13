<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_types', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'sort_order', 'name'], 'content_types_active_sort_name_idx');
        });

        Schema::create('custom_field_groups', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('target_type', 50)->default('content_type');
            $table->foreignUuid('target_id')->nullable()->constrained('content_types')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['target_type', 'target_id', 'slug'], 'custom_field_groups_target_slug_unique');
            $table->index(['target_type', 'target_id', 'is_active', 'sort_order'], 'custom_field_groups_target_active_sort_idx');
        });

        Schema::create('custom_fields', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('custom_field_group_id')->constrained('custom_field_groups')->cascadeOnDelete();
            $table->string('label');
            $table->string('name');
            $table->string('type', 50);
            $table->string('placeholder')->nullable();
            $table->text('instructions')->nullable();
            $table->json('options')->nullable();
            $table->json('default_value')->nullable();
            $table->json('validation_rules')->nullable();
            $table->boolean('is_required')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['custom_field_group_id', 'name'], 'custom_fields_group_name_unique');
            $table->index(['custom_field_group_id', 'is_active', 'sort_order'], 'custom_fields_group_active_sort_idx');
        });

        Schema::create('content_entries', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('content_type_id')->constrained('content_types')->cascadeOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->text('excerpt')->nullable();
            $table->string('status', 20)->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->json('data')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['content_type_id', 'slug'], 'content_entries_type_slug_unique');
            $table->index(['content_type_id', 'status', 'published_at', 'sort_order'], 'content_entries_type_status_publish_sort_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_entries');
        Schema::dropIfExists('custom_fields');
        Schema::dropIfExists('custom_field_groups');
        Schema::dropIfExists('content_types');
    }
};
