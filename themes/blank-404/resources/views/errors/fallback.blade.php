@php
    $title = $title ?? theme_setting('title', 'Website belum tersedia');
    $message = $message ?? theme_setting('message', 'Halaman ini belum tersedia. Silakan kembali lagi nanti.');
    $statusLabel = $statusLabel ?? 'Fallback Theme';
    $statusTitle = $statusTitle ?? 'Template belum tersedia';
    $showHomeButton = (bool) theme_setting('show_home_button', false);
    $showAdminLoginButton = (bool) theme_setting('show_admin_login_button', true);
    $adminLoginUrl = theme_admin_login_url();
@endphp

<section class="blank-card">
    <div class="blank-card__status">{{ $statusLabel }}</div>
    <h1>{{ $statusTitle }}</h1>
    <p class="blank-card__title">{{ $title }}</p>
    <p class="blank-card__message">{{ $message }}</p>

    @if ($showHomeButton || $showAdminLoginButton)
        <div class="blank-card__actions">
            @if ($showAdminLoginButton)
                <a href="{{ $adminLoginUrl }}" class="blank-button blank-button--primary">
                    Login Administrator
                </a>
            @endif

            @if ($showHomeButton)
                <a href="{{ url('/') }}" class="blank-button blank-button--ghost">
                    Kembali ke Home
                </a>
            @endif
        </div>
    @endif
</section>
