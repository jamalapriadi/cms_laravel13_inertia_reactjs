@php
    $title = $title ?? 'Nothing here yet';
    $message = $message ?? 'This section is ready for data from the CMS, but no items are available right now.';
    $actionLabel = $actionLabel ?? 'Back to home';
    $actionUrl = $actionUrl ?? url('/');
@endphp

<div class="theme-card rounded-[28px] border-dashed px-6 py-10 text-center">
    <p class="theme-eyebrow">Empty state</p>
    <h3 class="mt-3 text-xl font-semibold text-white">{{ $title }}</h3>
    <p class="mx-auto mt-3 max-w-2xl text-sm leading-7 text-stone-300">
        {{ $message }}
    </p>
    <div class="mt-6">
        <a href="{{ $actionUrl }}" class="theme-button theme-button--ghost">
            {{ $actionLabel }}
        </a>
    </div>
</div>
