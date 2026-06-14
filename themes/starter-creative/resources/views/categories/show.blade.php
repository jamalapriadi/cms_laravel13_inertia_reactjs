@extends('starter-creative::layouts.app')

@php
    $title = data_get($category, 'name') ?? 'Category';
    $description = data_get($category, 'description');
    $image = data_get($category, 'image') ?? (function_exists('theme_asset') ? theme_asset('images/hero-placeholder.svg') : '');
    $productItems = is_iterable($products ?? null) ? $products : [];
    $childCategories = data_get($category, 'children', []);
    $childCategories = is_iterable($childCategories) ? $childCategories : [];
@endphp

@section('content')
    <section class="theme-shell pt-10">
        <div class="theme-detail-grid grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div class="theme-card p-8 sm:p-10">
                <p class="theme-eyebrow">Category spotlight</p>
                <h1 class="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{{ $title }}</h1>
                @if($description)
                    <p class="mt-5 text-base leading-8 text-stone-300">{{ $description }}</p>
                @endif

                @if(count($childCategories) > 0)
                    <div class="mt-8 flex flex-wrap gap-3">
                        @foreach($childCategories as $childCategory)
                            @php
                                $childSlug = (string) (data_get($childCategory, 'slug') ?? '');
                            @endphp
                            <a
                                href="{{ $childSlug !== '' ? url('/category/'.rawurlencode($childSlug)) : '#' }}"
                                class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-stone-200 transition hover:bg-white/10"
                            >
                                {{ data_get($childCategory, 'name', 'Category') }}
                            </a>
                        @endforeach
                    </div>
                @endif
            </div>

            <div class="theme-card overflow-hidden">
                <img src="{{ $image }}" alt="{{ $title }}" class="h-full min-h-[320px] w-full object-cover">
            </div>
        </div>

        <div class="mt-14">
            @include('starter-creative::components.section-title', [
                'eyebrow' => 'Category products',
                'title' => 'Products inside this category',
                'description' => 'Category and product views stay safe even when some image, price, or relationship fields are absent.',
            ])

            @if(count($productItems) > 0)
                <div class="theme-card-grid theme-card-grid--four grid gap-6 md:grid-cols-2 xl:grid-cols-4" data-stagger-group>
                    @foreach($productItems as $product)
                        @include('starter-creative::components.product-card', ['product' => $product])
                    @endforeach
                </div>
            @else
                @include('starter-creative::partials.empty-state', [
                    'title' => 'This category has no products yet',
                    'message' => 'The template is active and safe, but no product data was supplied for this category page.',
                    'actionLabel' => 'Back to products',
                    'actionUrl' => url('/products'),
                ])
            @endif
        </div>
    </section>
@endsection
