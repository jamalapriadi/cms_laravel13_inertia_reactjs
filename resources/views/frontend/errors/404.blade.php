@extends('frontend.layouts.app')

@section('content')
    <section>
        <h2>404</h2>
        <p>{{ $message ?? 'Halaman yang kamu cari tidak ditemukan.' }}</p>
        <p><a href="{{ url('/') }}">Kembali ke homepage</a></p>
    </section>
@endsection
