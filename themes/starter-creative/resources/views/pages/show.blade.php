@extends('starter-creative::layouts.app')

@php
    $title = data_get($page, 'title') ?? 'Page';
    $excerpt = data_get($page, 'excerpt');
    $content = data_get($page, 'content') ?? data_get($page, 'body');
    $blocks = data_get($page, 'blocks', []);
    $blocks = is_iterable($blocks) ? $blocks : [];
    $jsonLikeContent = is_string($content) && str_starts_with(ltrim($content), '[');
@endphp

@section('content')
    <section class="theme-shell pt-10">
        <div class="mx-auto max-w-4xl">
            <div class="theme-card p-8 sm:p-10">
                <p class="theme-eyebrow">Page</p>
                <h1 class="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{{ $title }}</h1>
                @if($excerpt)
                    <p class="mt-5 text-base leading-8 text-stone-300">{{ $excerpt }}</p>
                @endif
            </div>

            <div class="mt-8">
                @if(count($blocks) > 0)
                    <div class="theme-stack space-y-5">
                        @foreach($blocks as $block)
                            @php
                                $blockTitle = data_get($block, 'props.title') ?? data_get($block, 'props.heading');
                                $blockBody = data_get($block, 'props.text') ?? data_get($block, 'props.html') ?? data_get($block, 'props.content');
                            @endphp
                            @if($blockTitle || $blockBody)
                                <section class="theme-card p-6 sm:p-7">
                                    @if($blockTitle)
                                        <h2 class="text-xl font-semibold text-white">{{ $blockTitle }}</h2>
                                    @endif
                                    @if($blockBody)
                                        <div class="theme-prose mt-4">
                                            {!! is_string($blockBody) ? $blockBody : '' !!}
                                        </div>
                                    @endif
                                </section>
                            @endif
                        @endforeach
                    </div>
                @elseif(is_string($content) && $content !== '' && ! $jsonLikeContent)
                    <article class="theme-card theme-prose p-8 sm:p-10">
                        {!! $content !!}
                    </article>
                @else
                    @include('starter-creative::partials.empty-state', [
                        'title' => 'This page is ready for content',
                        'message' => 'No body content was provided yet, but the template is active and safe to customize.',
                        'actionLabel' => 'Back to home',
                        'actionUrl' => url('/'),
                    ])
                @endif
            </div>
        </div>
    </section>
@endsection
