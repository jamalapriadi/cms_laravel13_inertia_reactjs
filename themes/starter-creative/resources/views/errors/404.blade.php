@extends('starter-creative::layouts.app')

@section('content')
    <section class="theme-shell pt-14">
        <div class="mx-auto max-w-3xl">
            @include('starter-creative::partials.empty-state', [
                'title' => '404 - Page not found',
                'message' => $message ?? 'The requested page could not be resolved by the active theme. The error template is still loaded safely.',
                'actionLabel' => 'Return home',
                'actionUrl' => url('/'),
            ])
        </div>
    </section>
@endsection
