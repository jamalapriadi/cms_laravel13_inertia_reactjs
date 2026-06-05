<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_email_otps', function (Blueprint $table) {
            $table->id();
            $table->uuid('customer_id');
            $table->string('email')->index();
            $table->string('otp_hash');
            $table->string('type')->default('email_verification');
            $table->timestamp('expires_at')->index();
            $table->timestamp('verified_at')->nullable()->index();
            $table->timestamp('invalidated_at')->nullable()->index();
            $table->timestamps();

            $table->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->cascadeOnDelete();

            $table->index(['customer_id', 'type', 'verified_at', 'invalidated_at'], 'customer_email_otps_lookup_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_email_otps');
    }
};
