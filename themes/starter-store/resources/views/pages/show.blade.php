@extends('starter-store::layouts.app')

@section('content')
    <section class="shell page-shell">
        <article class="rich-card">
            <p class="eyebrow">Page</p>
            <h1>{{ $page['title'] ?? 'Page' }}</h1>

            @if(!empty($page['excerpt']))
                <p class="lead">{{ $page['excerpt'] }}</p>
            @endif

            @if(!empty($page['content']))
                <div class="rich-content">{!! $page['content'] !!}</div>
            @endif
        </article>
    </section>
@endsection
