<article class="product-card">
    @if(!empty($product['thumbnail']))
        <img src="{{ $product['thumbnail'] }}" alt="{{ $product['name'] }}" class="product-card__image">
    @endif

    <div class="product-card__body">
        <div>
            <p class="product-card__title">{{ $product['name'] }}</p>
            @if(!empty($product['short_description']))
                <p class="product-card__description">{{ $product['short_description'] }}</p>
            @endif
        </div>

        <div class="product-card__footer">
            <strong>Rp{{ number_format((float) ($product['final_price'] ?? 0), 0, ',', '.') }}</strong>
            <a href="{{ url('/products/'.$product['slug']) }}" class="button button--ghost">Detail</a>
        </div>
    </div>
</article>
