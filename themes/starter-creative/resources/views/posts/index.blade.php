@extends('starter-creative::layouts.app')

@php
    $postPaginator = $posts instanceof \Illuminate\Contracts\Pagination\Paginator ? $posts : null;
    $postItems = $postPaginator ? $postPaginator->items() : (is_iterable($posts ?? null) ? $posts : []);
@endphp

@section('content')
    <section class="theme-shell pt-10">
        @include('starter-creative::components.section-title', [
            'eyebrow' => 'Article archive',
            'title' => 'Posts ready for blog, journal, or newsroom themes',
            'description' => 'This archive view accepts controller-provided post data and stays stable when the collection is empty.',
        ])

        @if(count($postItems) > 0)
            <div class="theme-card-grid theme-card-grid--three grid gap-6 md:grid-cols-2 xl:grid-cols-3" data-stagger-group>
                @foreach($postItems as $post)
                    @include('starter-creative::components.post-card', ['post' => $post])
                @endforeach
            </div>

            @if($postPaginator && ($postPaginator->previousPageUrl() || $postPaginator->nextPageUrl()))
                <div class="theme-pagination mt-10 flex flex-col items-start justify-between gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center">
                    <p class="text-sm text-stone-300">
                        Page {{ $postPaginator->currentPage() }} of {{ max($postPaginator->lastPage(), 1) }}
                    </p>
                    <div class="flex gap-3">
                        @if($postPaginator->previousPageUrl())
                            <a href="{{ $postPaginator->previousPageUrl() }}" class="theme-button theme-button--ghost">Previous</a>
                        @endif
                        @if($postPaginator->nextPageUrl())
                            <a href="{{ $postPaginator->nextPageUrl() }}" class="theme-button">Next</a>
                        @endif
                    </div>
                </div>
            @endif
        @else
            @include('starter-creative::partials.empty-state', [
                'title' => 'No posts available',
                'message' => 'The archive template is active, but the CMS has not provided any published posts yet.',
                'actionLabel' => 'Back to home',
                'actionUrl' => url('/'),
            ])
        @endif
    </section>
@endsection
