@extends('starter-store::layouts.app')

@section('content')
    <section class="hero">
        <div class="shell hero__grid">
            <div class="hero__content">
                <p class="eyebrow">{{ $contents['homepage.hero.eyebrow'] ?? 'Laravel CMS Theme' }}</p>
                <h1>{{ $contents['homepage.hero.title'] ?? 'Starter theme yang aman untuk storefront kamu.' }}</h1>
                <p class="lead">
                    {{ $contents['homepage.hero.subtitle'] ?? 'Theme aktif hanya menangani render Blade, sementara business logic tetap ada di core Laravel.' }}
                </p>
                <div class="hero__actions">
                    <a href="{{ url('/products') }}" class="button">
                        {{ $contents['homepage.hero.button_primary'] ?? 'Lihat Produk' }}
                    </a>
                    <a href="{{ url('/category/'.($categories[0]['slug'] ?? '')) }}" class="button button--ghost">
                        {{ $contents['homepage.hero.button_secondary'] ?? 'Jelajahi Kategori' }}
                    </a>
                </div>
            </div>

            <div class="hero__panel">
                <div class="hero__panel-card">
                    <span class="hero__panel-label">Latest Products</span>
                    <strong>{{ count($latestProducts ?? []) }}</strong>
                    <p>Ditata dari query core yang sama tanpa logic di dalam theme.</p>
                </div>
            </div>
        </div>
    </section>

    @if(!empty($categories))
        <section class="shell section">
            <div class="section__heading">
                <h2>Popular Categories</h2>
                <a href="{{ url('/products') }}">Shop all</a>
            </div>
            <div class="category-grid">
                @foreach($categories as $category)
                    <a href="{{ url('/category/'.$category['slug']) }}" class="tile">
                        <span class="tile__title">{{ $category['name'] }}</span>
                        <span class="tile__meta">{{ $category['products_count'] ?? 0 }} products</span>
                    </a>
                @endforeach
            </div>
        </section>
    @endif

    @if(!empty($featuredProducts))
        <section class="shell section">
            <div class="section__heading">
                <div>
                    <p class="eyebrow">Featured</p>
                    <h2>{{ $contents['homepage.best_seller.title'] ?? 'Best Seller Picks' }}</h2>
                </div>
                <p>{{ $contents['homepage.best_seller.description'] ?? 'Produk unggulan yang diambil dari core product catalog service.' }}</p>
            </div>
            <div class="product-grid">
                @foreach($featuredProducts as $product)
                    @include('starter-store::components.product-card', ['product' => $product])
                @endforeach
            </div>
        </section>
    @endif
@endsection
