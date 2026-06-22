@extends('starter-store::layouts.app')

@php
    $content = data_get($page, 'content') ?? data_get($page, 'body');
    $blocks = data_get($page, 'blocks', []);
    $blocks = is_iterable($blocks) ? $blocks : [];
    $jsonLikeContent = is_string($content) && str_starts_with(ltrim($content), '[');
@endphp

@section('content')
    <section class="shell page-shell">
        <article class="rich-card">
            <p class="eyebrow">Page</p>
            <h1>{{ $page['title'] ?? 'Page' }}</h1>

            @if(!empty($page['excerpt']))
                <p class="lead">{{ $page['excerpt'] }}</p>
            @endif

            @if(count($blocks) > 0)
                @foreach($blocks as $block)
                    @php
                        $blockTitle = data_get($block, 'data.title') ?? data_get($block, 'data.heading') ?? data_get($block, 'props.title') ?? data_get($block, 'props.heading');
                        $blockBody = data_get($block, 'data.text') ?? data_get($block, 'data.html') ?? data_get($block, 'data.content') ?? data_get($block, 'props.text') ?? data_get($block, 'props.html') ?? data_get($block, 'props.content');
                    @endphp

                    @if($blockTitle)
                        <h2>{{ $blockTitle }}</h2>
                    @endif

                    @if($blockBody)
                        <div class="rich-content">{!! is_string($blockBody) ? $blockBody : '' !!}</div>
                    @endif
                @endforeach
            @elseif(is_string($content) && $content !== '' && ! $jsonLikeContent)
                <div class="rich-content">{!! $content !!}</div>
            @endif
        </article>
    </section>
@endsection
