<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table): void {
            if (! Schema::hasColumn('carts', 'cart_token')) {
                $table->string('cart_token', 100)->nullable()->unique()->after('customer_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table): void {
            if (Schema::hasColumn('carts', 'cart_token')) {
                $table->dropUnique(['cart_token']);
                $table->dropColumn('cart_token');
            }
        });
    }
};
