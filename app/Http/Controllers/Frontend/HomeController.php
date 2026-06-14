<?php

namespace App\Http\Controllers\Frontend;

use App\CMS\Themes\ThemeManager;
use App\CMS\Themes\ThemePageDataFactory;
use App\Http\Controllers\Controller;
use App\Models\Theme;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class HomeController extends Controller
{
    public function __construct(
        private readonly ThemeManager $themeManager,
        private readonly ThemePageDataFactory $themePageDataFactory,
    ) {}

    public function __invoke(Request $request): View
    {
        return $this->themeManager->render('home', $this->themePageDataFactory->home($request));
    }

    public function preview(Request $request, Theme $theme): View
    {
        $this->themeManager->useTheme($theme);

        return $this->themeManager->render('home', array_merge(
            $this->themePageDataFactory->home($request),
            ['previewTheme' => $theme]
        ));
    }

    public function notFound(string $message = 'Halaman tidak ditemukan.'): Response
    {
        return response(
            $this->themeManager->render('404', ['message' => $message], 'frontend.errors.404'),
            404,
        );
    }
}
