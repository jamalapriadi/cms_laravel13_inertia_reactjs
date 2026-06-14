@php
    $brandName = function_exists('theme_setting')
        ? (string) theme_setting('site_title', $siteSettings['site_name'] ?? config('app.name'))
        : (string) ($siteSettings['site_name'] ?? config('app.name'));
    $mainMenu = data_get($menus ?? [], 'main', []);
    $mainMenu = is_iterable($mainMenu) ? $mainMenu : [];
@endphp

<header class="sticky top-0 z-40">
    <div class="theme-shell pt-5">
        <div class="theme-card theme-header-card flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
            <div class="flex items-center gap-3">
                <a href="{{ url('/') }}" class="text-lg font-semibold tracking-[0.18em] text-white uppercase">
                    {{ $brandName }}
                </a>
                <span class="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.28em] text-stone-300 md:inline-flex">
                    Blade runtime theme
                </span>
            </div>

            <nav class="theme-main-nav hidden items-center gap-2 md:flex" aria-label="Main navigation">
                @forelse($mainMenu as $item)
                    <a
                        href="{{ data_get($item, 'url', '#') }}"
                        class="rounded-full px-4 py-2 text-sm text-stone-300 transition hover:bg-white/5 hover:text-white"
                    >
                        {{ data_get($item, 'title', 'Menu') }}
                    </a>
                @empty
                    <a href="{{ url('/posts') }}" class="rounded-full px-4 py-2 text-sm text-stone-300 transition hover:bg-white/5 hover:text-white">Posts</a>
                    <a href="{{ url('/products') }}" class="rounded-full px-4 py-2 text-sm text-stone-300 transition hover:bg-white/5 hover:text-white">Products</a>
                @endforelse
            </nav>

            <div class="flex items-center gap-3">
                <a href="{{ url('/products') }}" class="theme-button hidden sm:inline-flex">
                    Explore catalog
                </a>
                <button
                    type="button"
                    class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white md:hidden"
                    aria-label="Toggle navigation"
                    aria-expanded="false"
                    data-theme-menu-toggle
                >
                    <span class="theme-menu-burger">
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </button>
            </div>
        </div>

        <div class="theme-mobile-nav mt-3 rounded-[28px] border border-white/10 bg-neutral-900/95 p-4 backdrop-blur md:hidden" data-theme-mobile-nav data-open="false">
            <div class="grid gap-2">
                @forelse($mainMenu as $item)
                    <a
                        href="{{ data_get($item, 'url', '#') }}"
                        class="rounded-2xl border border-white/5 px-4 py-3 text-sm text-stone-200 transition hover:bg-white/5"
                    >
                        {{ data_get($item, 'title', 'Menu') }}
                    </a>
                @empty
                    <a href="{{ url('/posts') }}" class="rounded-2xl border border-white/5 px-4 py-3 text-sm text-stone-200 transition hover:bg-white/5">Posts</a>
                    <a href="{{ url('/products') }}" class="rounded-2xl border border-white/5 px-4 py-3 text-sm text-stone-200 transition hover:bg-white/5">Products</a>
                    <a href="{{ url('/') }}" class="rounded-2xl border border-white/5 px-4 py-3 text-sm text-stone-200 transition hover:bg-white/5">Home</a>
                @endforelse
            </div>
        </div>
    </div>
</header>
