<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? theme_setting('site_title', $siteSettings['site_name'] ?? config('app.name')) }}</title>

    @foreach(theme_assets('css') as $css)
        <link rel="stylesheet" href="{{ theme_asset($css) }}">
    @endforeach
</head>
<body class="default-admin-login-theme">
    <main class="login-shell">
        @yield('content')
    </main>

    @foreach(theme_assets('js') as $js)
        <script src="{{ theme_asset($js) }}" defer></script>
    @endforeach
</body>
</html>
