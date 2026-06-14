@extends('blank-404::layouts.app')

@section('content')
    @include('blank-404::errors.fallback', [
        'statusLabel' => '404',
        'statusTitle' => '404 - Halaman tidak ditemukan',
        'title' => theme_setting('title', 'Website belum tersedia'),
        'message' => $message ?? '404 - Halaman tidak ditemukan.',
    ])
@endsection
