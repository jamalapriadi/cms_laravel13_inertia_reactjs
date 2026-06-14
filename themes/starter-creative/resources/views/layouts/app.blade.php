@php
    $themeCssAssets = function_exists('theme_assets') ? array_values(array_filter((array) theme_assets('css'))) : [];
    $themeJsAssets = function_exists('theme_assets') ? array_values(array_filter((array) theme_assets('js'))) : [];
    $siteTitle = function_exists('theme_setting')
        ? (string) theme_setting('site_title', $siteSettings['site_name'] ?? config('app.name'))
        : (string) ($siteSettings['site_name'] ?? config('app.name'));
    $documentTitle = isset($title) && is_string($title) && $title !== ''
        ? "{$title} | {$siteTitle}"
        : $siteTitle;
    $metaDescription = $metaDescription
        ?? $siteSettings['site_description']
        ?? $siteSettings['tagline']
        ?? 'Starter Creative runtime theme for Laravel CMS.';
    $primaryColor = function_exists('theme_setting') ? (string) theme_setting('primary_color', '#2563eb') : '#2563eb';
    $animationsEnabled = function_exists('theme_setting') ? (bool) theme_setting('show_animations', true) : true;
    $sliderEnabled = function_exists('theme_setting') ? (bool) theme_setting('show_slider', true) : true;
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full scroll-smooth">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="{{ $metaDescription }}">
    <title>{{ $documentTitle }}</title>
    @foreach($themeCssAssets as $css)
        @php
            $href = function_exists('theme_asset') ? theme_asset($css) : '';
        @endphp
        @if($href !== '')
            <link rel="stylesheet" href="{{ $href }}">
        @endif
    @endforeach
</head>
<body
    class="min-h-full bg-neutral-950 text-stone-100 antialiased"
    style="--theme-primary: {{ $primaryColor }};"
    data-theme-animations="{{ $animationsEnabled ? 'true' : 'false' }}"
    data-theme-slider="{{ $sliderEnabled ? 'true' : 'false' }}"
>
    <div class="theme-backdrop"></div>

    <div class="relative isolate">
        @include('starter-creative::partials.header')

        <main class="pb-16">
            @if(! empty($previewTheme))
                <div class="theme-shell pt-4">
                    <div class="theme-preview-banner rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-blue-100">
                        Preview mode: {{ $previewTheme->name ?? $previewTheme->slug ?? 'Theme Preview' }}
                    </div>
                </div>
            @endif

            @yield('content')
        </main>

        @include('starter-creative::partials.footer')
    </div>

    @foreach($themeJsAssets as $js)
        @php
            $src = function_exists('theme_asset') ? theme_asset($js) : '';
        @endphp
        @if($src !== '')
            <script src="{{ $src }}" defer></script>
        @endif
    @endforeach
</body>
</html>
