@php
    $eyebrow = $eyebrow ?? 'Section';
    $title = $title ?? 'Starter Creative';
    $description = $description ?? null;
    $actionLabel = $actionLabel ?? null;
    $actionUrl = $actionUrl ?? null;
@endphp

<div class="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
    <div class="max-w-3xl space-y-3">
        <p class="theme-eyebrow">{{ $eyebrow }}</p>
        <h2 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {{ $title }}
        </h2>
        @if($description)
            <p class="text-sm leading-7 text-stone-300 sm:text-base">
                {{ $description }}
            </p>
        @endif
    </div>

    @if($actionLabel && $actionUrl)
        <div>
            <a href="{{ $actionUrl }}" class="theme-button theme-button--ghost">
                {{ $actionLabel }}
            </a>
        </div>
    @endif
</div>
