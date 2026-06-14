@extends('default-admin-login::layouts.app')

@section('content')
    <section class="login-stage">
        <div class="login-stage__backdrop"></div>

        <div class="not-found-card">
            <span class="eyebrow">404</span>
            <h1>Halaman Tidak Ditemukan</h1>
            <p>{{ $message ?? 'Resource yang Anda cari tidak tersedia pada fallback theme ini.' }}</p>
            <a href="{{ url('/') }}" class="submit-button submit-button--inline">Kembali ke Beranda</a>
        </div>
    </section>
@endsection
