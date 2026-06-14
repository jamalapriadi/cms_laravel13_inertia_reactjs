@extends('frontend.layouts.app')

@section('content')
    <section>
        <h2>{{ $category['name'] ?? 'Category' }}</h2>
        @if(!empty($category['description']))
            <p>{{ $category['description'] }}</p>
        @endif

        <ul>
            @foreach(($products ?? []) as $product)
                <li>
                    <a href="{{ url('/products/'.$product['slug']) }}">{{ $product['name'] }}</a>
                </li>
            @endforeach
        </ul>
    </section>
@endsection
