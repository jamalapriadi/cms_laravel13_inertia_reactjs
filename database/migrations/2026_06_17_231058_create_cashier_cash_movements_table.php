<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cashier_cash_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cashier_session_id')->nullable()->constrained('cashier_sessions')->onDelete('cascade');
            $table->foreignId('cashier_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->string('type'); // cash_in, cash_out, adjustment, owner_withdrawal, expense
            $table->string('direction'); // in, out
            $table->decimal('amount', 15, 2);
            $table->string('status')->default('pending'); // pending, approved, rejected, cancelled
            $table->text('reason');
            $table->text('note')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamps();

            $table->index('cashier_session_id');
            $table->index('cashier_id');
            $table->index('created_by');
            $table->index('approved_by');
            $table->index('type');
            $table->index('direction');
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cashier_cash_movements');
    }
};
