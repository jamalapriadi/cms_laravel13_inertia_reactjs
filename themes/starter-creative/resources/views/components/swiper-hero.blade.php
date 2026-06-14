@php
    $fallbackImage = function_exists('theme_asset') ? theme_asset('images/hero-placeholder.svg') : '';
    $defaultTitle = function_exists('theme_setting')
        ? (string) theme_setting('hero_title', 'Build Beautiful Laravel CMS Themes')
        : 'Build Beautiful Laravel CMS Themes';
    $defaultSubtitle = function_exists('theme_setting')
        ? (string) theme_setting('hero_subtitle', 'Starter theme with TailwindCSS v4, GSAP animations, and SwiperJS slider.')
        : 'Starter theme with TailwindCSS v4, GSAP animations, and SwiperJS slider.';
    $slides = collect($slides ?? $bannerSlides ?? [])
        ->filter(fn ($slide) => is_array($slide) || is_object($slide))
        ->values()
        ->all();
    $featuredCategorySlug = (string) data_get($categories ?? [], '0.slug', '');
    $featuredCategoryUrl = $featuredCategorySlug !== '' ? url('/category/'.rawurlencode($featuredCategorySlug)) : url('/products');

    if ($slides === []) {
        $slides = [
            [
                'title' => $defaultTitle,
                'subtitle' => 'Starter Creative',
                'description' => $defaultSubtitle,
                'image_url' => $fallbackImage,
                'button_text' => 'Browse posts',
                'button_url' => url('/posts'),
            ],
            [
                'title' => 'Blade runtime. Asset build kept local.',
                'subtitle' => 'Upload-ready workflow',
                'description' => 'Keep production uploads free from npm while still giving theme developers a modern local workflow.',
                'image_url' => $fallbackImage,
                'button_text' => 'Explore products',
                'button_url' => url('/products'),
            ],
            [
                'title' => 'Developer-friendly structure for new themes.',
                'subtitle' => 'Safe by default',
                'description' => 'Pages, posts, products, categories, error states, and preview mode are already wired in as a starter base.',
                'image_url' => $fallbackImage,
                'button_text' => 'See categories',
                'button_url' => $featuredCategoryUrl,
            ],
        ];
    }
@endphp

<section class="pt-6">
    <div class="theme-shell">
        <div class="swiper theme-hero-swiper overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-2xl shadow-black/30" data-theme-swiper>
            <div class="swiper-wrapper">
                @foreach($slides as $index => $slide)
                    @php
                        $slideTitle = data_get($slide, 'title') ?: $defaultTitle;
                        $slideSubtitle = data_get($slide, 'subtitle') ?: 'Starter Creative';
                        $slideDescription = data_get($slide, 'description') ?: data_get($slide, 'subtitle') ?: $defaultSubtitle;
                        $slideImage = data_get($slide, 'image_url') ?: data_get($slide, 'image') ?: $fallbackImage;
                        $slideButtonText = data_get($slide, 'button_text') ?: 'Learn more';
                        $slideButtonUrl = data_get($slide, 'button_url') ?: url('/products');
                    @endphp

                    <div class="swiper-slide">
                        <div class="theme-hero-grid grid min-h-[640px] gap-8 overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.2),_transparent_28rem)] p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
                            <div class="flex flex-col justify-between gap-8">
                                <div class="space-y-6">
                                    <p class="theme-eyebrow" data-animate="fade-up">{{ $slideSubtitle }}</p>
                                    <h1
                                        class="max-w-3xl font-semibold tracking-tight text-white text-4xl sm:text-5xl lg:text-6xl"
                                        data-animate="fade-up"
                                        @if($index === 0)
                                            data-gsap-text="{{ $slideTitle }}"
                                        @endif
                                    >{{ $index === 0 ? '' : $slideTitle }}</h1>
                                    <p class="max-w-2xl text-base leading-8 text-stone-200 sm:text-lg" data-animate="fade-up">
                                        {{ $slideDescription }}
                                    </p>
                                </div>

                                <div class="flex flex-col gap-4 sm:flex-row sm:items-center" data-animate="fade-up">
                                    <a href="{{ $slideButtonUrl }}" class="theme-button">
                                        {{ $slideButtonText }}
                                    </a>
                                    <div class="rounded-full border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-300">
                                        Blade runtime, local Tailwind + Vite build, upload-ready assets.
                                    </div>
                                </div>
                            </div>

                            <div class="relative flex items-end justify-center">
                                <div class="absolute inset-x-8 top-8 hidden rounded-[28px] border border-blue-300/20 bg-blue-500/10 p-4 text-sm text-blue-50 lg:block">
                                    Swiper hero, GSAP headline, and starter-safe empty states are prewired.
                                </div>
                                <div class="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-white/10 bg-black/30 p-3 shadow-2xl shadow-black/40">
                                    <img
                                        src="{{ $slideImage }}"
                                        alt="{{ $slideTitle }}"
                                        class="h-full min-h-[360px] w-full rounded-[24px] object-cover"
                                    >
                                </div>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>

            <div class="swiper-pagination !bottom-6"></div>
        </div>
    </div>
</section>
