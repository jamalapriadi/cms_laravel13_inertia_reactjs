@extends('frontend.layouts.app')

@php
    $postCollection = $posts ?? collect();
    $postItems = $postCollection instanceof \Illuminate\Contracts\Pagination\Paginator
        ? $postCollection->items()
        : (is_iterable($postCollection) ? $postCollection : []);
@endphp

@section('content')
    <section>
        <h2>Artikel</h2>

        @if(empty($postItems))
            <p>Belum ada artikel yang tersedia.</p>
        @else
            <ul>
                @foreach($postItems as $post)
                    <li>
                        <a href="{{ url('/posts/'.($post['slug'] ?? $post->slug ?? '')) }}">
                            {{ $post['title'] ?? $post->title ?? 'Artikel' }}
                        </a>
                    </li>
                @endforeach
            </ul>
        @endif
    </section>
@endsection
