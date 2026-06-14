@extends('starter-store::layouts.app')

@section('content')
    <section class="shell page-shell">
        <div class="section__heading">
            <div>
                <p class="eyebrow">Catalog</p>
                <h1>All Products</h1>
            </div>
            <p>{{ $pagination['total'] ?? count($products ?? []) }} items ditemukan</p>
        </div>

        <div class="product-grid">
            @forelse(($products ?? []) as $product)
                @include('starter-store::components.product-card', ['product' => $product])
            @empty
                <div class="empty-state">
                    Belum ada produk yang bisa ditampilkan.
                </div>
            @endforelse
        </div>
    </section>
@endsection
