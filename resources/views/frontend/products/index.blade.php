@extends('frontend.layouts.app')

@section('content')
    <section>
        <h2>Products</h2>
        <p>Total: {{ $pagination['total'] ?? count($products ?? []) }}</p>

        <ul>
            @foreach(($products ?? []) as $product)
                <li>
                    <a href="{{ url('/products/'.$product['slug']) }}">{{ $product['name'] }}</a>
                    <span>{{ number_format((float) ($product['final_price'] ?? 0), 0, ',', '.') }}</span>
                </li>
            @endforeach
        </ul>
    </section>
@endsection
