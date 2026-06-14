@extends('blank-404::layouts.app')

@section('content')
    @include('blank-404::errors.fallback', [
        'statusLabel' => 'Blank Theme',
        'statusTitle' => 'Website belum tersedia',
        'title' => theme_setting('title', 'Website belum tersedia'),
        'message' => theme_setting('message', 'Halaman ini belum tersedia. Silakan kembali lagi nanti.'),
    ])
@endsection
