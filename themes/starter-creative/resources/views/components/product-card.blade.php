@php
    $title = data_get($product, 'name') ?? data_get($product, 'title') ?? 'Untitled product';
    $slug = (string) (data_get($product, 'slug') ?? '');
    $description = data_get($product, 'short_description')
        ?? data_get($product, 'description')
        ?? 'Connect your product resource to enrich this card with stronger merchandising copy.';
    $price = data_get($product, 'final_price')
        ?? data_get($product, 'selling_price')
        ?? data_get($product, 'price');
    $priceLabel = $price !== null ? 'Rp '.number_format((float) $price, 0, ',', '.') : 'Price on request';
    $brandName = data_get($product, 'brand.name') ?? data_get($product, 'categories.0.name') ?? 'Catalog item';
    $image = data_get($product, 'thumbnail')
        ?? data_get($product, 'featured_image')
        ?? data_get($product, 'image')
        ?? data_get($product, 'images.0.url')
        ?? (function_exists('theme_asset') ? theme_asset('images/placeholder.svg') : '');
    $href = $slug !== '' ? url('/products/'.rawurlencode($slug)) : '#';
@endphp

<article class="theme-card group h-full" data-animate="fade-up">
    <a href="{{ $href }}" class="flex h-full flex-col">
        <div class="aspect-[4/3] overflow-hidden bg-white/5">
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
                <span>{{ $brandName }}</span>
                <span>{{ data_get($product, 'stock_status') ?? 'available' }}</span>
            </div>
            <div class="space-y-2">
                <h3 class="text-xl font-semibold text-white">{{ $title }}</h3>
                <p class="text-sm leading-7 text-stone-300">
                    {{ \Illuminate\Support\Str::limit((string) strip_tags((string) $description), 150) }}
                </p>
            </div>
            <div class="mt-auto flex items-center justify-between gap-3">
                <span class="text-lg font-semibold text-white">{{ $priceLabel }}</span>
                <span class="inline-flex items-center gap-2 text-sm font-semibold text-blue-200">
                    View product
                    <span aria-hidden="true">+</span>
                </span>
            </div>
        </div>
    </a>
</article>
