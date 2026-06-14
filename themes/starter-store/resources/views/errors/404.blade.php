@extends('starter-store::layouts.app')

@section('content')
    <section class="shell page-shell">
        <div class="rich-card">
            <p class="eyebrow">404</p>
            <h1>Page not found</h1>
            <p>{{ $message ?? 'Konten yang kamu cari tidak tersedia pada theme aktif.' }}</p>
            <a href="{{ url('/') }}" class="button">Back to home</a>
        </div>
    </section>
@endsection
