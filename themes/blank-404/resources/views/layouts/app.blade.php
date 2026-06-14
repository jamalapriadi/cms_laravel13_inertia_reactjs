<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? theme_setting('title', 'Website belum tersedia') }}</title>

    @foreach(theme_assets('css') as $css)
        <link rel="stylesheet" href="{{ theme_asset($css) }}">
    @endforeach
</head>
<body class="blank-404-theme">
    <main class="blank-shell">
        @yield('content')
    </main>

    @foreach(theme_assets('js') as $js)
        <script src="{{ theme_asset($js) }}" defer></script>
    @endforeach
</body>
</html>
