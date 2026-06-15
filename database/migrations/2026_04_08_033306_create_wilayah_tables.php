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
        // Provinsi (ID 2 Digit)
        Schema::create('provinces', function (Blueprint $table) {
            $table->char('id', 2)->primary(); // Contoh: '32'
            $table->string('name')->index();
            $table->string('lat')->nullable();
            $table->string('lng')->nullable();
            $table->timestamps();
        });

        // Kabupaten/Kota (ID 4 Digit, format: 32.73)
        Schema::create('kabupatens', function (Blueprint $table) {
            $table->char('id', 5)->primary();
            $table->char('province_id', 2);
            $table->string('name')->index();
            $table->string('lat')->nullable();
            $table->string('lng')->nullable();
            $table->timestamps();

            $table->foreign('province_id')->references('id')->on('provinces')->onDelete('cascade');
        });

        // Kecamatan (ID 6 Digit, format: 32.73.01)
        Schema::create('kecamatans', function (Blueprint $table) {
            $table->char('id', 8)->primary();
            $table->char('kabupaten_id', 5);
            $table->string('name')->index();
            $table->string('lat')->nullable();
            $table->string('lng')->nullable();
            $table->timestamps();

            $table->foreign('kabupaten_id')->references('id')->on('kabupatens')->onDelete('cascade');
        });

        // Kelurahan (ID 10 Digit, format: 32.73.01.1001)
        Schema::create('kelurahans', function (Blueprint $table) {
            $table->char('id', 13)->primary();
            $table->char('kecamatan_id', 8);
            $table->string('name')->index();
            $table->string('lat')->nullable();
            $table->string('lng')->nullable();
            $table->timestamps();

            $table->foreign('kecamatan_id')->references('id')->on('kecamatans')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kelurahans');
        Schema::dropIfExists('kecamatans');
        Schema::dropIfExists('kabupatens');
        Schema::dropIfExists('provinces');
    }
};
