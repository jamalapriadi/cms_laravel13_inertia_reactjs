@extends('starter-creative::layouts.app')

@php
    $title = data_get($post, 'title') ?? 'Article';
    $publishedAt = data_get($post, 'published_at');
    $publishedLabel = $publishedAt ? date('d M Y', strtotime((string) $publishedAt)) : null;
    $image = data_get($post, 'thumbnail') ?? data_get($post, 'featured_image');
    $content = data_get($post, 'content') ?? data_get($post, 'body');
    $blocks = data_get($post, 'blocks', []);
    $blocks = is_iterable($blocks) ? $blocks : [];
    $jsonLikeContent = is_string($content) && str_starts_with(ltrim($content), '[');
@endphp

@section('content')
    <section class="theme-shell pt-10">
        <div class="mx-auto max-w-4xl space-y-8">
            <article class="theme-card p-8 sm:p-10">
                <p class="theme-eyebrow">Article detail</p>
                <h1 class="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{{ $title }}</h1>
                <div class="mt-5 flex flex-wrap items-center gap-3 text-sm text-stone-300">
                    @if($publishedLabel)
                        <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1">{{ $publishedLabel }}</span>
                    @endif
                    @if(data_get($post, 'categories.0.name'))
                        <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                            {{ data_get($post, 'categories.0.name') }}
                        </span>
                    @endif
                </div>
            </article>

            @if($image)
                <div class="theme-card overflow-hidden">
                    <img src="{{ $image }}" alt="{{ $title }}" class="h-full max-h-[540px] w-full object-cover">
                </div>
            @endif

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
                    'title' => 'This article has no body content yet',
                    'message' => 'The post detail template is active and can still render title, metadata, and media safely.',
                    'actionLabel' => 'Back to posts',
                    'actionUrl' => url('/posts'),
                ])
            @endif
        </div>
    </section>
@endsection
