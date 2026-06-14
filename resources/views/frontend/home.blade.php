@extends('frontend.layouts.app')

@section('content')
    <section>
        <p>{{ $contents['homepage.hero.eyebrow'] ?? 'Theme fallback' }}</p>
        <h2>{{ $contents['homepage.hero.title'] ?? 'Belum ada theme aktif' }}</h2>
        <p>{{ $contents['homepage.hero.subtitle'] ?? 'Aktifkan theme dari dashboard untuk melihat tampilan storefront.' }}</p>
    </section>

    @if(!empty($latestProducts))
        <section>
            <h3>Produk Terbaru</h3>
            <ul>
                @foreach($latestProducts as $product)
                    <li>
                        <a href="{{ url('/products/'.$product['slug']) }}">{{ $product['name'] }}</a>
                    </li>
                @endforeach
            </ul>
        </section>
    @endif
@endsection
