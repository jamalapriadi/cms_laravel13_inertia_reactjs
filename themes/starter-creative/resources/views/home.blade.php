@extends('starter-creative::layouts.app')

@php
    $postItems = is_iterable($latestPosts ?? null) ? $latestPosts : [];
    $productItems = is_iterable($latestProducts ?? null) ? $latestProducts : [];
    $categoryItems = is_iterable($categories ?? null) ? $categories : [];
    $heroTitle = function_exists('theme_setting')
        ? (string) theme_setting('hero_title', 'Build Beautiful Laravel CMS Themes')
        : 'Build Beautiful Laravel CMS Themes';
    $heroSubtitle = function_exists('theme_setting')
        ? (string) theme_setting('hero_subtitle', 'Starter theme with TailwindCSS v4, GSAP animations, and SwiperJS slider.')
        : 'Starter theme with TailwindCSS v4, GSAP animations, and SwiperJS slider.';
@endphp

@section('content')
    @include('starter-creative::components.swiper-hero', ['slides' => $bannerSlides ?? []])

    <section class="theme-shell -mt-10 relative z-10">
        <div class="theme-stat-grid grid gap-4 lg:grid-cols-3" data-stagger-group>
            <div class="theme-card p-6">
                <p class="theme-eyebrow">Theme structure</p>
                <h2 class="mt-3 text-2xl font-semibold text-white">Runtime and source are separated cleanly.</h2>
                <p class="mt-3 text-sm leading-7 text-stone-300">
                    Blade templates stay upload-safe while Tailwind, GSAP, and Swiper live in a local development workspace.
                </p>
            </div>
            <div class="theme-card p-6">
                <p class="theme-eyebrow">Hero settings</p>
                <h2 class="mt-3 text-xl font-semibold text-white">{{ $heroTitle }}</h2>
                <p class="mt-3 text-sm leading-7 text-stone-300">{{ $heroSubtitle }}</p>
            </div>
            <div class="theme-card p-6">
                <p class="theme-eyebrow">Data readiness</p>
                <h2 class="mt-3 text-2xl font-semibold text-white">{{ count($postItems) }} posts, {{ count($productItems) }} products</h2>
                <p class="mt-3 text-sm leading-7 text-stone-300">
                    Empty states are included, so preview mode remains calm even when CMS data is still empty.
                </p>
            </div>
        </div>
    </section>

    <section class="theme-shell mt-14">
        @include('starter-creative::components.section-title', [
            'eyebrow' => 'Recent stories',
            'title' => 'Latest posts ready for editorial themes',
            'description' => 'The starter theme accepts CMS-provided post data without querying the database directly from Blade.',
            'actionLabel' => 'Open post archive',
            'actionUrl' => url('/posts'),
        ])

        @if(count($postItems) > 0)
            <div class="theme-card-grid theme-card-grid--three grid gap-6 md:grid-cols-2 xl:grid-cols-3" data-stagger-group>
                @foreach($postItems as $post)
                    @include('starter-creative::components.post-card', ['post' => $post])
                @endforeach
            </div>
        @else
            @include('starter-creative::partials.empty-state', [
                'title' => 'No posts published yet',
                'message' => 'The home template is ready for article data. Publish content in the CMS and the card grid will populate automatically.',
                'actionLabel' => 'Go to home',
                'actionUrl' => url('/'),
            ])
        @endif
    </section>

    <section class="theme-shell mt-14">
        @include('starter-creative::components.section-title', [
            'eyebrow' => 'Fresh catalog',
            'title' => 'Product cards that tolerate flexible field shapes',
            'description' => 'The starter card checks name/title, image fallbacks, and multiple price fields so theme developers can iterate safely.',
            'actionLabel' => 'Browse products',
            'actionUrl' => url('/products'),
        ])

        @if(count($productItems) > 0)
            <div class="theme-card-grid theme-card-grid--four grid gap-6 md:grid-cols-2 xl:grid-cols-4" data-stagger-group>
                @foreach($productItems as $product)
                    @include('starter-creative::components.product-card', ['product' => $product])
                @endforeach
            </div>
        @else
            @include('starter-creative::partials.empty-state', [
                'title' => 'No products available yet',
                'message' => 'The product section will render once the CMS passes product listing data into the active theme.',
                'actionLabel' => 'Stay on home',
                'actionUrl' => url('/'),
            ])
        @endif
    </section>

    <section class="theme-shell mt-14">
        @include('starter-creative::components.section-title', [
            'eyebrow' => 'Category grid',
            'title' => 'A visual category section for storefront-style themes',
            'description' => 'Categories can include descriptions, images, child items, and product counts without forcing hardcoded database access in Blade.',
        ])

        @if(count($categoryItems) > 0)
            <div class="theme-card-grid theme-card-grid--four grid gap-6 md:grid-cols-2 xl:grid-cols-4" data-stagger-group>
                @foreach($categoryItems as $category)
                    @include('starter-creative::components.category-card', ['category' => $category])
                @endforeach
            </div>
        @else
            @include('starter-creative::partials.empty-state', [
                'title' => 'Categories are still empty',
                'message' => 'This starter layout keeps the storefront polished even before category data is configured in the CMS.',
                'actionLabel' => 'Back to home',
                'actionUrl' => url('/'),
            ])
        @endif
    </section>
@endsection
