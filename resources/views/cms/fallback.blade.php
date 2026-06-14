@extends('frontend.layouts.app')

@php
    $status = $fallbackTemplateKey === '404' ? '404' : 'Frontend Fallback';
    $title = $title ?? 'Website belum tersedia';
    $message = $message ?? 'Halaman publik ini belum memiliki template yang siap ditampilkan.';
@endphp

@section('content')
    <section>
        <h2>{{ $status }}</h2>
        <p>{{ $title }}</p>
        <p>{{ $message }}</p>
        <p><a href="{{ theme_admin_login_url() }}">Login Administrator</a></p>
    </section>
@endsection
