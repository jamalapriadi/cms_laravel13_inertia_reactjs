@extends('blank-404::layouts.app')

@section('content')
    @include('blank-404::errors.fallback', [
        'statusLabel' => 'Product Listing',
        'statusTitle' => 'Template belum tersedia',
        'title' => theme_setting('title', 'Website belum tersedia'),
        'message' => $message ?? 'Halaman katalog produk belum tersedia saat ini.',
    ])
@endsection
