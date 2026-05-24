<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('password')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_login_at')->nullable();
            $table->text('address')->nullable();
            $table->json('metadata')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            $table->index('name');
            $table->index('phone');
            $table->index('is_active');
        });

        Schema::table('carts', function (Blueprint $table) {
            $table->uuid('customer_id')->nullable()->after('id');

            $table->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->nullOnDelete();

            $table->index('customer_id');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->uuid('customer_id')->nullable()->after('invoice_number');

            $table->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->nullOnDelete();

            $table->index('customer_id');
        });

        $userIds = collect(DB::table('carts')->whereNotNull('user_id')->pluck('user_id'))
            ->merge(DB::table('orders')->whereNotNull('user_id')->pluck('user_id'))
            ->unique()
            ->values();

        if ($userIds->isNotEmpty()) {
            DB::table('users')
                ->whereIn('id', $userIds)
                ->orderBy('id')
                ->get()
                ->each(function ($user) {
                    $customerId = (string) Str::uuid();

                    DB::table('customers')->insert([
                        'id' => $customerId,
                        'name' => $user->name,
                        'email' => $user->email,
                        'password' => $user->password,
                        'email_verified_at' => $user->email_verified_at,
                        'is_active' => $user->is_active ?? true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    DB::table('carts')
                        ->where('user_id', $user->id)
                        ->update(['customer_id' => $customerId]);

                    DB::table('orders')
                        ->where('user_id', $user->id)
                        ->update(['customer_id' => $customerId]);
                });
        }

        Schema::table('carts', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropColumn('user_id');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropColumn('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->uuid('user_id')->nullable()->after('invoice_number');
            $table->index('user_id');
            $table->dropForeign(['customer_id']);
            $table->dropIndex(['customer_id']);
            $table->dropColumn('customer_id');
        });

        Schema::table('carts', function (Blueprint $table) {
            $table->uuid('user_id')->nullable()->after('id');
            $table->index('user_id');
            $table->dropForeign(['customer_id']);
            $table->dropIndex(['customer_id']);
            $table->dropColumn('customer_id');
        });

        Schema::dropIfExists('customers');
    }
};
