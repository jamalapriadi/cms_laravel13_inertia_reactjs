@extends('frontend.layouts.app')

@php
    $content = data_get($page, 'content') ?? data_get($page, 'body');
    $blocks = data_get($page, 'blocks', []);
    $blocks = is_iterable($blocks) ? $blocks : [];
    $jsonLikeContent = is_string($content) && str_starts_with(ltrim($content), '[');
@endphp

@section('content')
    <article>
        <h2>{{ $page['title'] ?? 'Page' }}</h2>
        @if(!empty($page['excerpt']))
            <p>{{ $page['excerpt'] }}</p>
        @endif

        @if(count($blocks) > 0)
            @foreach($blocks as $block)
                @php
                    $blockTitle = data_get($block, 'data.title') ?? data_get($block, 'data.heading') ?? data_get($block, 'props.title') ?? data_get($block, 'props.heading');
                    $blockBody = data_get($block, 'data.text') ?? data_get($block, 'data.html') ?? data_get($block, 'data.content') ?? data_get($block, 'props.text') ?? data_get($block, 'props.html') ?? data_get($block, 'props.content');
                @endphp

                @if($blockTitle)
                    <h3>{{ $blockTitle }}</h3>
                @endif

                @if($blockBody)
                    <div>{!! is_string($blockBody) ? $blockBody : '' !!}</div>
                @endif
            @endforeach
        @elseif(is_string($content) && $content !== '' && ! $jsonLikeContent)
            <div>{!! $content !!}</div>
        @endif
    </article>
@endsection
