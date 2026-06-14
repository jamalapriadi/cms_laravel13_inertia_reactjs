@extends('blank-404::layouts.app')

@section('content')
    @include('blank-404::errors.fallback', [
        'statusLabel' => 'Page Unavailable',
        'statusTitle' => 'Template belum tersedia',
        'title' => theme_setting('title', 'Website belum tersedia'),
        'message' => $message ?? 'Template halaman publik belum tersedia untuk page ini.',
    ])
@endsection
