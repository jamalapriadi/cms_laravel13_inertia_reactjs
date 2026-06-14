<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? ($siteSettings['site_name'] ?? config('app.name')) }}</title>
    <style>
        :root {
            --theme-primary: {{ theme_setting('primary_color', '#166534') }};
            --theme-width: {{ theme_setting('container_width', '1120px') }};
            --theme-radius: {{ theme_setting('button_radius', '18px') }};
        }
    </style>
    @foreach(theme_assets('css') as $css)
        <link rel="stylesheet" href="{{ theme_asset($css) }}">
    @endforeach
</head>
<body class="starter-theme">
    @if(theme_setting('show_topbar', true))
        <div class="topbar">
            <div class="shell topbar__content">
                <span>Starter Store Theme</span>
                <span>{{ $siteSettings['site_name'] ?? config('app.name') }}</span>
            </div>
        </div>
    @endif

    <header class="shell site-header">
        <a href="{{ url('/') }}" class="brand">
            {{ $siteSettings['site_name'] ?? config('app.name') }}
        </a>

        @if(!empty($menus['main'] ?? []))
            <nav class="main-nav" aria-label="Main navigation">
                @foreach(($menus['main'] ?? []) as $item)
                    <a href="{{ $item['url'] ?? '#' }}">{{ $item['title'] ?? 'Menu' }}</a>
                @endforeach
            </nav>
        @endif
    </header>

    <main>
        @yield('content')
    </main>

    <footer class="site-footer">
        <div class="shell site-footer__inner">
            <div>
                <strong>{{ $siteSettings['site_name'] ?? config('app.name') }}</strong>
                <p>{{ $contents['footer.description'] ?? 'Frontend storefront kamu akan dirender dari theme aktif.' }}</p>
            </div>
            <a href="{{ url('/products') }}" class="button button--ghost">Browse Products</a>
        </div>
    </footer>

    @foreach(theme_assets('js') as $js)
        <script src="{{ theme_asset($js) }}" defer></script>
    @endforeach
</body>
</html>
