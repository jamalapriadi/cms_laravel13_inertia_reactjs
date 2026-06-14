@php
    $title = data_get($post, 'title') ?? data_get($post, 'name') ?? 'Untitled article';
    $slug = (string) (data_get($post, 'slug') ?? '');
    $excerpt = data_get($post, 'excerpt') ?? data_get($post, 'description') ?? 'Add an excerpt or body content to make this card more informative.';
    $publishedAt = data_get($post, 'published_at') ?? data_get($post, 'created_at');
    $publishedLabel = $publishedAt ? date('d M Y', strtotime((string) $publishedAt)) : 'Draft article';
    $categoryName = data_get($post, 'categories.0.name') ?? 'Editorial';
    $image = data_get($post, 'thumbnail')
        ?? data_get($post, 'image')
        ?? (function_exists('theme_asset') ? theme_asset('images/placeholder.svg') : '');
    $href = $slug !== '' ? url('/posts/'.rawurlencode($slug)) : '#';
@endphp

<article class="theme-card group h-full" data-animate="fade-up">
    <a href="{{ $href }}" class="flex h-full flex-col">
        <div class="aspect-[16/10] overflow-hidden bg-white/5">
            @if($image)
                <img
                    src="{{ $image }}"
                    alt="{{ $title }}"
                    class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                >
            @endif
        </div>

        <div class="flex flex-1 flex-col gap-4 p-6">
            <div class="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.24em] text-stone-400">
                <span>{{ $categoryName }}</span>
                <span>{{ $publishedLabel }}</span>
            </div>
            <h3 class="text-xl font-semibold text-white">
                {{ $title }}
            </h3>
            <p class="text-sm leading-7 text-stone-300">
                {{ \Illuminate\Support\Str::limit((string) $excerpt, 160) }}
            </p>
            <span class="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-blue-200">
                Read article
                <span aria-hidden="true">+</span>
            </span>
        </div>
    </a>
</article>
