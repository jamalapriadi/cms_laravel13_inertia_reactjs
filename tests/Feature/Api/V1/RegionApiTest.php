<?php

use App\Models\Dashboard\Kabupaten;
use App\Models\Dashboard\Kecamatan;
use App\Models\Dashboard\Kelurahan;
use App\Models\Dashboard\Province;

it('can list provinces', function () {
    $province = Province::create(['id' => '99', 'name' => 'Test Province']);

    $response = $this->getJson('/api/v1/provinces');

    $response->assertStatus(200)
        ->assertJsonPath('data.data.0.name', 'Test Province');
});

it('can search provinces', function () {
    Province::create(['id' => '98', 'name' => 'Find Me Province']);
    Province::create(['id' => '97', 'name' => 'Hidden']);

    $response = $this->getJson('/api/v1/provinces?search=Find');

    $response->assertStatus(200)
        ->assertJsonPath('data.data.0.name', 'Find Me Province')
        ->assertJsonMissing(['name' => 'Hidden']);
});

it('can list kabupatens by province', function () {
    $province = Province::create(['id' => '96', 'name' => 'Prov 96']);
    Kabupaten::create(['id' => '9601', 'province_id' => '96', 'name' => 'Kab 9601']);
    Kabupaten::create(['id' => '9602', 'province_id' => '96', 'name' => 'Kab 9602']);

    $response = $this->getJson('/api/v1/provinces/96/kabupatens');

    $response->assertStatus(200)
        ->assertJsonCount(2, 'data.data');
});

it('can show a single province', function () {
    $province = Province::create(['id' => '95', 'name' => 'Prov 95']);

    $response = $this->getJson("/api/v1/provinces/{$province->id}");

    $response->assertStatus(200)
        ->assertJsonPath('data.name', 'Prov 95');
});

it('returns 404 for invalid province', function () {
    $response = $this->getJson('/api/v1/provinces/not-found');

    $response->assertStatus(404);
});

it('can list kecamatans by kabupaten', function () {
    $province = Province::create(['id' => '94', 'name' => 'Prov 94']);
    $kabupaten = Kabupaten::create(['id' => '9401', 'province_id' => '94', 'name' => 'Kab 9401']);
    Kecamatan::create(['id' => '940101', 'kabupaten_id' => '9401', 'name' => 'Kec 940101']);

    $response = $this->getJson('/api/v1/kabupatens/9401/kecamatans');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data.data')
        ->assertJsonPath('data.data.0.name', 'Kec 940101');
});

it('can list kelurahans by kecamatan', function () {
    $province = Province::create(['id' => '93', 'name' => 'Prov 93']);
    $kabupaten = Kabupaten::create(['id' => '9301', 'province_id' => '93', 'name' => 'Kab 9301']);
    $kecamatan = Kecamatan::create(['id' => '930101', 'kabupaten_id' => '9301', 'name' => 'Kec 930101']);
    Kelurahan::create(['id' => '9301010001', 'kecamatan_id' => '930101', 'name' => 'Kel 1']);
    Kelurahan::create(['id' => '9301010002', 'kecamatan_id' => '930101', 'name' => 'Kel 2']);

    $response = $this->getJson('/api/v1/kecamatans/930101/kelurahans');

    $response->assertStatus(200)
        ->assertJsonCount(2, 'data.data');
});

it('respects per_page pagination', function () {
    $province = Province::create(['id' => '92', 'name' => 'Prov Pagination']);
    for ($i = 1; $i <= 5; $i++) {
        Kabupaten::create([
            'id' => "920{$i}",
            'province_id' => '92',
            'name' => "Kab {$i}",
        ]);
    }

    $response = $this->getJson('/api/v1/kabupatens?province_id=92&per_page=3');

    $response->assertStatus(200)
        ->assertJsonCount(3, 'data.data');
});
