@extends('starter-creative::layouts.app')

@section('content')
    <section class="theme-shell pt-14">
        <div class="mx-auto max-w-3xl">
            @include('starter-creative::partials.empty-state', [
                'title' => 'Template fallback is active',
                'message' => 'The requested CMS template is not available yet, so Starter Creative rendered its safe fallback view instead.',
                'actionLabel' => 'Go to home',
                'actionUrl' => url('/'),
            ])
        </div>
    </section>
@endsection
