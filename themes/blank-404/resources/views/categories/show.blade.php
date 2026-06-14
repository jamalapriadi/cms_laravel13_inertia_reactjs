@extends('blank-404::layouts.app')

@section('content')
    @include('blank-404::errors.fallback', [
        'statusLabel' => 'Category Page',
        'statusTitle' => 'Template belum tersedia',
        'title' => theme_setting('title', 'Website belum tersedia'),
        'message' => $message ?? 'Halaman kategori belum tersedia saat ini.',
    ])
@endsection
