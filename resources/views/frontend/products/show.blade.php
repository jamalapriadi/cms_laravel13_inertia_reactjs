@extends('frontend.layouts.app')

@section('content')
    <article>
        <h2>{{ $product['name'] ?? 'Product' }}</h2>
        @if(!empty($product['short_description']))
            <p>{{ $product['short_description'] }}</p>
        @endif

        @if(!empty($product['description']))
            <div>{!! nl2br(e($product['description'])) !!}</div>
        @endif

        @if(!empty($relatedProducts))
            <section>
                <h3>Related Products</h3>
                <ul>
                    @foreach($relatedProducts as $relatedProduct)
                        <li>
                            <a href="{{ url('/products/'.$relatedProduct['slug']) }}">
                                {{ $relatedProduct['name'] }}
                            </a>
                        </li>
                    @endforeach
                </ul>
            </section>
        @endif
    </article>
@endsection
