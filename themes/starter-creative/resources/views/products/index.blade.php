@extends('starter-creative::layouts.app')

@php
    $productItems = is_iterable($products ?? null) ? $products : [];
    $total = data_get($pagination ?? [], 'total', count($productItems));
@endphp

@section('content')
    <section class="theme-shell pt-10">
        @include('starter-creative::components.section-title', [
            'eyebrow' => 'Catalog index',
            'title' => 'Product listing built for flexible storefront schemas',
            'description' => 'Cards can read multiple image and price fields without coupling this starter theme to one rigid product shape.',
        ])

        <div class="mb-6 rounded-[28px] border border-white/10 bg-white/5 px-5 py-4 text-sm text-stone-300">
            Showing {{ count($productItems) }} items from {{ $total }} total product records.
        </div>

        @if(count($productItems) > 0)
            <div class="theme-card-grid theme-card-grid--four grid gap-6 md:grid-cols-2 xl:grid-cols-4" data-stagger-group>
                @foreach($productItems as $product)
                    @include('starter-creative::components.product-card', ['product' => $product])
                @endforeach
            </div>
        @else
            @include('starter-creative::partials.empty-state', [
                'title' => 'No products found',
                'message' => 'The product index template is active, but no catalog data was passed into the theme.',
                'actionLabel' => 'Back to home',
                'actionUrl' => url('/'),
            ])
        @endif
    </section>
@endsection
