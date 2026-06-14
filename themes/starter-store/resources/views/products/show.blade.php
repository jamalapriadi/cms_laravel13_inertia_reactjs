@extends('starter-store::layouts.app')

@section('content')
    <section class="shell page-shell">
        <article class="product-detail">
            <div class="product-detail__intro">
                <p class="eyebrow">Product Detail</p>
                <h1>{{ $product['name'] ?? 'Product' }}</h1>
                @if(!empty($product['short_description']))
                    <p class="lead">{{ $product['short_description'] }}</p>
                @endif
            </div>

            @if(!empty($product['images']))
                <div class="product-gallery">
                    @foreach($product['images'] as $image)
                        @if(!empty($image['url']))
                            <img src="{{ $image['url'] }}" alt="{{ $product['name'] }}">
                        @endif
                    @endforeach
                </div>
            @endif

            @if(!empty($product['description']))
                <div class="rich-card">
                    <h2>Description</h2>
                    <p>{{ $product['description'] }}</p>
                </div>
            @endif

            @if(!empty($relatedProducts))
                <div class="section__heading">
                    <h2>You may also like</h2>
                </div>
                <div class="product-grid">
                    @foreach($relatedProducts as $relatedProduct)
                        @include('starter-store::components.product-card', ['product' => $relatedProduct])
                    @endforeach
                </div>
            @endif
        </article>
    </section>
@endsection
