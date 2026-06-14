@extends('starter-creative::layouts.app')

@php
    $title = data_get($product, 'name') ?? data_get($product, 'title') ?? 'Product';
    $description = data_get($product, 'description') ?? data_get($product, 'short_description');
    $price = data_get($product, 'final_price') ?? data_get($product, 'selling_price') ?? data_get($product, 'price');
    $priceLabel = $price !== null ? 'Rp '.number_format((float) $price, 0, ',', '.') : 'Price on request';
    $images = data_get($product, 'images', []);
    $images = is_iterable($images) ? $images : [];
    $primaryImage = data_get($product, 'thumbnail')
        ?? data_get($product, 'featured_image')
        ?? data_get($product, 'image')
        ?? data_get($product, 'images.0.url')
        ?? (function_exists('theme_asset') ? theme_asset('images/placeholder.svg') : '');
    $relatedItems = is_iterable($relatedProducts ?? null) ? $relatedProducts : [];
@endphp

@section('content')
    <section class="theme-shell pt-10">
        <div class="theme-detail-grid grid gap-8 lg:grid-cols-[1fr_0.95fr]">
            <div class="space-y-4">
                <div class="theme-card overflow-hidden">
                    <img src="{{ $primaryImage }}" alt="{{ $title }}" class="h-full max-h-[560px] w-full object-cover">
                </div>

                @if(count($images) > 1)
                    <div class="theme-gallery-grid grid gap-4 sm:grid-cols-3">
                        @foreach($images as $image)
                            <div class="theme-card overflow-hidden">
                                <img
                                    src="{{ data_get($image, 'url', $primaryImage) }}"
                                    alt="{{ $title }}"
                                    class="aspect-square h-full w-full object-cover"
                                >
                            </div>
                        @endforeach
                    </div>
                @endif
            </div>

            <div class="theme-card p-8 sm:p-10">
                <p class="theme-eyebrow">Product detail</p>
                <h1 class="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{{ $title }}</h1>
                <div class="mt-6 flex flex-wrap items-center gap-3 text-sm text-stone-300">
                    <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1">{{ $priceLabel }}</span>
                    @if(data_get($product, 'brand.name'))
                        <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1">{{ data_get($product, 'brand.name') }}</span>
                    @endif
                    @if(data_get($product, 'categories.0.name'))
                        <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1">{{ data_get($product, 'categories.0.name') }}</span>
                    @endif
                </div>

                @if($description)
                    <div class="theme-prose mt-8">
                        {!! is_string($description) ? $description : '' !!}
                    </div>
                @else
                    <div class="mt-8 rounded-[24px] border border-dashed border-white/10 px-5 py-6 text-sm text-stone-300">
                        This product is active in the theme, but no description field was provided yet.
                    </div>
                @endif
            </div>
        </div>

        <div class="mt-14">
            @include('starter-creative::components.section-title', [
                'eyebrow' => 'Related picks',
                'title' => 'Products can reference related items safely',
                'description' => 'If related product data is missing, the theme keeps this section quiet instead of erroring.',
            ])

            @if(count($relatedItems) > 0)
                <div class="theme-card-grid theme-card-grid--four grid gap-6 md:grid-cols-2 xl:grid-cols-4" data-stagger-group>
                    @foreach($relatedItems as $relatedProduct)
                        @include('starter-creative::components.product-card', ['product' => $relatedProduct])
                    @endforeach
                </div>
            @else
                @include('starter-creative::partials.empty-state', [
                    'title' => 'No related products available',
                    'message' => 'This area is ready for recommendation data once the CMS starts providing related items.',
                    'actionLabel' => 'Back to catalog',
                    'actionUrl' => url('/products'),
                ])
            @endif
        </div>
    </section>
@endsection
