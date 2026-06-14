@extends('starter-store::layouts.app')

@section('content')
    <section class="shell page-shell">
        <div class="section__heading">
            <div>
                <p class="eyebrow">Category</p>
                <h1>{{ $category['name'] ?? 'Category' }}</h1>
            </div>
            @if(!empty($category['description']))
                <p>{{ $category['description'] }}</p>
            @endif
        </div>

        <div class="product-grid">
            @forelse(($products ?? []) as $product)
                @include('starter-store::components.product-card', ['product' => $product])
            @empty
                <div class="empty-state">Belum ada produk di kategori ini.</div>
            @endforelse
        </div>
    </section>
@endsection
