<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? config('app.name') }}</title>
</head>
<body>
    <header>
        <h1>{{ config('app.name') }}</h1>
        @if(!empty($menus['main'] ?? []))
            <nav aria-label="Main navigation">
                <ul>
                    @foreach(($menus['main'] ?? []) as $item)
                        <li>
                            <a href="{{ $item['url'] ?? '#' }}">{{ $item['title'] ?? 'Menu' }}</a>
                        </li>
                    @endforeach
                </ul>
            </nav>
        @endif
    </header>

    <main>
        @yield('content')
    </main>

    <footer>
        <p>{{ $siteSettings['site_name'] ?? config('app.name') }}</p>
    </footer>
</body>
</html>
