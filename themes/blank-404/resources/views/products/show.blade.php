@extends('blank-404::layouts.app')

@section('content')
    @include('blank-404::errors.fallback', [
        'statusLabel' => 'Product Detail',
        'statusTitle' => 'Template belum tersedia',
        'title' => theme_setting('title', 'Website belum tersedia'),
        'message' => $message ?? 'Halaman detail produk belum tersedia saat ini.',
    ])
@endsection
