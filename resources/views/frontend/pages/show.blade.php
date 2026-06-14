@extends('frontend.layouts.app')

@section('content')
    <article>
        <h2>{{ $page['title'] ?? 'Page' }}</h2>
        @if(!empty($page['excerpt']))
            <p>{{ $page['excerpt'] }}</p>
        @endif

        @if(!empty($page['content']))
            <div>{!! $page['content'] !!}</div>
        @endif
    </article>
@endsection
