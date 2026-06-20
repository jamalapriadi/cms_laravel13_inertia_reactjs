<?php

use App\Models\Term;
use App\Models\TermTaxonomy;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('can retrieve paginated tag list', function () {
    $term1 = Term::create(['name' => 'Bunga Papan', 'slug' => 'bunga-papan']);
    TermTaxonomy::create(['term_id' => $term1->id, 'taxonomy' => 'tags', 'description' => 'Desc 1']);

    $term2 = Term::create(['name' => 'Mawar', 'slug' => 'mawar']);
    TermTaxonomy::create(['term_id' => $term2->id, 'taxonomy' => 'tags', 'description' => 'Desc 2']);

    // Another taxonomy to ensure it's filtered
    $term3 = Term::create(['name' => 'Category 1', 'slug' => 'category-1']);
    TermTaxonomy::create(['term_id' => $term3->id, 'taxonomy' => 'categories', 'description' => 'Desc 3']);

    $response = $this->getJson('/api/v1/tags');

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.name', 'Bunga Papan')
        ->assertJsonPath('data.1.name', 'Mawar')
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name', 'slug', 'description', 'created_at', 'updated_at'],
            ],
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
        ]);
});

it('can search tags', function () {
    $term1 = Term::create(['name' => 'Bunga Papan', 'slug' => 'bunga-papan']);
    TermTaxonomy::create(['term_id' => $term1->id, 'taxonomy' => 'tags']);

    $term2 = Term::create(['name' => 'Mawar Merah', 'slug' => 'mawar-merah']);
    TermTaxonomy::create(['term_id' => $term2->id, 'taxonomy' => 'tags']);

    $response = $this->getJson('/api/v1/tags?search=Papan');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Bunga Papan');
});

it('can sort tags by name ascending', function () {
    $term1 = Term::create(['name' => 'Zebra', 'slug' => 'zebra']);
    TermTaxonomy::create(['term_id' => $term1->id, 'taxonomy' => 'tags']);

    $term2 = Term::create(['name' => 'Apple', 'slug' => 'apple']);
    TermTaxonomy::create(['term_id' => $term2->id, 'taxonomy' => 'tags']);

    $response = $this->getJson('/api/v1/tags?sort=name_asc');

    $response->assertStatus(200)
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.name', 'Apple')
        ->assertJsonPath('data.1.name', 'Zebra');
});

it('can retrieve tag detail by slug', function () {
    $term = Term::create(['name' => 'Bunga Papan', 'slug' => 'bunga-papan']);
    TermTaxonomy::create(['term_id' => $term->id, 'taxonomy' => 'tags', 'description' => 'Detail desc']);

    $response = $this->getJson('/api/v1/tags/bunga-papan');

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.name', 'Bunga Papan')
        ->assertJsonPath('data.slug', 'bunga-papan')
        ->assertJsonPath('data.description', 'Detail desc');
});

it('returns 404 if tag is not found', function () {
    $response = $this->getJson('/api/v1/tags/not-found');

    $response->assertStatus(404)
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Tag not found');
});

it('returns 404 if slug belongs to a different taxonomy', function () {
    $term = Term::create(['name' => 'Category 1', 'slug' => 'category-1']);
    TermTaxonomy::create(['term_id' => $term->id, 'taxonomy' => 'categories']);

    $response = $this->getJson('/api/v1/tags/category-1');

    $response->assertStatus(404)
        ->assertJsonPath('message', 'Tag not found');
});
