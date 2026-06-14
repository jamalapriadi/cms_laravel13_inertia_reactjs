@extends('default-admin-login::layouts.app')

@php
    $loginField = $fallbackLogin['field'] ?? 'email';
    $passwordField = $fallbackLogin['password_field'] ?? 'password';
    $rememberField = $fallbackLogin['remember_field'] ?? 'remember';
    $rememberSupported = (bool) ($fallbackLogin['remember_supported'] ?? true);
    $loginAction = $fallbackLogin['action'] ?? url('/auth/login');
    $forgotPasswordUrl = $fallbackLogin['forgot_password_url'] ?? null;
    $siteTitle = theme_setting('site_title', $siteSettings['site_name'] ?? config('app.name', 'CMS Login'));
    $loginTitle = theme_setting('login_title', 'Administrator Login');
    $loginSubtitle = theme_setting('login_subtitle', 'Masuk ke dashboard untuk mengelola website.');
@endphp

@section('content')
    <section class="login-stage">
        <div class="login-stage__backdrop"></div>

        <div class="login-grid">
            <div class="login-copy">
                <span class="eyebrow">CMS Fallback Theme</span>
                <h1>{{ $siteTitle }}</h1>
                <p class="lead">
                    Default theme ini tampil otomatis saat belum ada storefront theme aktif. Form ini tetap memakai flow auth project yang sudah ada.
                </p>

                <div class="feature-list">
                    <div class="feature-card">
                        <strong>Lightweight Blade</strong>
                        <p>Tidak memaksa halaman root menjadi Inertia, jadi aman untuk fallback awal instalasi.</p>
                    </div>
                    <div class="feature-card">
                        <strong>Existing Auth Flow</strong>
                        <p>Submit form diarahkan ke endpoint login existing tanpa membuat controller auth duplikat.</p>
                    </div>
                </div>
            </div>

            <div class="login-card-wrap">
                <div class="login-card">
                    <div class="login-card__header">
                        <span class="brand-mark">{{ strtoupper(substr((string) $siteTitle, 0, 1)) }}</span>
                        <div>
                            <p class="brand-label">{{ $siteTitle }}</p>
                            <h2>{{ $loginTitle }}</h2>
                            <p>{{ $loginSubtitle }}</p>
                        </div>
                    </div>

                    @if (session('status'))
                        <div class="alert alert--success">
                            {{ session('status') }}
                        </div>
                    @endif

                    @if ($errors->any())
                        <div class="alert alert--error">
                            {{ $errors->first() }}
                        </div>
                    @endif

                    <form method="POST" action="{{ $loginAction }}" class="login-form">
                        @csrf

                        <label class="field">
                            <span>{{ $loginField === 'email' ? 'Email Address' : 'Username' }}</span>
                            <input
                                type="{{ $loginField === 'email' ? 'email' : 'text' }}"
                                name="{{ $loginField }}"
                                value="{{ old($loginField) }}"
                                autocomplete="{{ $loginField === 'email' ? 'email' : 'username' }}"
                                placeholder="{{ $loginField === 'email' ? 'admin@example.com' : 'your-username' }}"
                                required
                            >
                            @error($loginField)
                                <small class="field-error">{{ $message }}</small>
                            @enderror
                        </label>

                        <label class="field">
                            <span>Password</span>
                            <input
                                type="password"
                                name="{{ $passwordField }}"
                                autocomplete="current-password"
                                placeholder="Masukkan password"
                                required
                            >
                            @error($passwordField)
                                <small class="field-error">{{ $message }}</small>
                            @enderror
                        </label>

                        <div class="login-form__meta">
                            @if ($rememberSupported)
                                <label class="remember-field">
                                    <input
                                        type="checkbox"
                                        name="{{ $rememberField }}"
                                        value="1"
                                        @checked(old($rememberField))
                                    >
                                    <span>Remember me</span>
                                </label>
                            @else
                                <span></span>
                            @endif

                            @if ($forgotPasswordUrl)
                                <a href="{{ $forgotPasswordUrl }}" class="text-link">
                                    Forgot password?
                                </a>
                            @endif
                        </div>

                        <button type="submit" class="submit-button">
                            Sign In to Dashboard
                        </button>
                    </form>

                    <div class="login-card__footer">
                        <span>Fallback theme aktif karena belum ada frontend theme utama.</span>
                        <span>{{ config('app.name', 'CMS') }}</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
@endsection
