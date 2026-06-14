@extends('frontend.layouts.app')

@section('content')
    <article>
        <h2>{{ $post['title'] ?? 'Artikel' }}</h2>

        @if(! empty($post['published_at']))
            <p>{{ $post['published_at'] }}</p>
        @endif

        @if(! empty($post['excerpt']))
            <p>{{ $post['excerpt'] }}</p>
        @endif

        @if(! empty($post['content']))
            <div>{!! is_string($post['content']) ? $post['content'] : '' !!}</div>
        @endif
    </article>
@endsection
