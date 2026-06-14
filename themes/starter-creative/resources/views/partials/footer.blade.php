@php
    $brandName = function_exists('theme_setting')
        ? (string) theme_setting('site_title', $siteSettings['site_name'] ?? config('app.name'))
        : (string) ($siteSettings['site_name'] ?? config('app.name'));
    $mainMenu = data_get($menus ?? [], 'main', []);
    $mainMenu = is_iterable($mainMenu) ? $mainMenu : [];
    $featuredCategorySlug = (string) data_get($categories ?? [], '0.slug', '');
    $featuredCategoryUrl = $featuredCategorySlug !== '' ? url('/category/'.rawurlencode($featuredCategorySlug)) : url('/products');
@endphp

<footer class="theme-shell pb-10">
    <div class="theme-card overflow-hidden px-6 py-8 sm:px-8">
        <div class="theme-footer-grid grid gap-8 lg:grid-cols-[1.4fr_0.9fr_0.9fr]">
            <div class="space-y-4">
                <p class="theme-eyebrow">Starter Creative</p>
                <h2 class="max-w-xl text-2xl font-semibold text-white sm:text-3xl">
                    Upload-ready Blade theme with a local-first asset workflow.
                </h2>
                <p class="max-w-2xl text-sm leading-7 text-stone-300">
                    {{ $contents['footer.description'] ?? 'Use this starter as a launchpad for editorial, product, and category-driven CMS builds without coupling the runtime to npm on production.' }}
                </p>
            </div>

            <div>
                <h3 class="text-sm font-semibold uppercase tracking-[0.24em] text-stone-400">Quick links</h3>
                <div class="mt-4 grid gap-2">
                    <a href="{{ url('/') }}" class="text-sm text-stone-300 transition hover:text-white">Home</a>
                    <a href="{{ url('/posts') }}" class="text-sm text-stone-300 transition hover:text-white">Posts</a>
                    <a href="{{ url('/products') }}" class="text-sm text-stone-300 transition hover:text-white">Products</a>
                    <a href="{{ $featuredCategoryUrl }}" class="text-sm text-stone-300 transition hover:text-white">Categories</a>
                </div>
            </div>

            <div>
                <h3 class="text-sm font-semibold uppercase tracking-[0.24em] text-stone-400">Theme menu</h3>
                <div class="mt-4 grid gap-2">
                    @forelse($mainMenu as $item)
                        <a href="{{ data_get($item, 'url', '#') }}" class="text-sm text-stone-300 transition hover:text-white">
                            {{ data_get($item, 'title', 'Menu') }}
                        </a>
                    @empty
                        <span class="text-sm text-stone-500">No main menu configured yet.</span>
                    @endforelse
                </div>
            </div>
        </div>

        <div class="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs uppercase tracking-[0.24em] text-stone-500 sm:flex-row sm:items-center sm:justify-between">
            <span>{{ $brandName }}</span>
            <span>{{ now()->format('Y') }} Laravel CMS theme starter</span>
        </div>
    </div>
</footer>
