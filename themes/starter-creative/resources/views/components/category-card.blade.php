@php
    $title = data_get($category, 'name') ?? data_get($category, 'title') ?? 'Untitled category';
    $slug = (string) (data_get($category, 'slug') ?? '');
    $description = data_get($category, 'description') ?? 'Attach a category description to make this tile more informative.';
    $productCount = data_get($category, 'products_count');
    $image = data_get($category, 'image')
        ?? data_get($category, 'featured_image')
        ?? (function_exists('theme_asset') ? theme_asset('images/placeholder.svg') : '');
    $href = $slug !== '' ? url('/category/'.rawurlencode($slug)) : '#';
@endphp

<article class="theme-card group h-full" data-animate="fade-up">
    <a href="{{ $href }}" class="flex h-full flex-col">
        <div class="aspect-[5/4] overflow-hidden bg-white/5">
            @if($image)
                <img
                    src="{{ $image }}"
                    alt="{{ $title }}"
                    class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                >
            @endif
        </div>

        <div class="flex flex-1 flex-col gap-4 p-6">
            <div class="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.24em] text-stone-400">
                <span>Category</span>
                <span>{{ $productCount !== null ? $productCount.' items' : 'Ready for products' }}</span>
            </div>
            <h3 class="text-xl font-semibold text-white">{{ $title }}</h3>
            <p class="text-sm leading-7 text-stone-300">
                {{ \Illuminate\Support\Str::limit((string) strip_tags((string) $description), 150) }}
            </p>
            <span class="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-blue-200">
                Open category
                <span aria-hidden="true">+</span>
            </span>
        </div>
    </a>
</article>
