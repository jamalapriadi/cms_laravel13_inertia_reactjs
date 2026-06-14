<?php

namespace App\Http\Controllers\Frontend;

use App\CMS\Themes\ThemeManager;
use App\CMS\Themes\ThemePageDataFactory;
use App\Http\Controllers\Controller;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PageController extends Controller
{
    public function __construct(
        private readonly ThemeManager $themeManager,
        private readonly ThemePageDataFactory $themePageDataFactory,
        private readonly HomeController $homeController,
    ) {}

    public function show(Request $request, string $slug): View|Response
    {
        $payload = $this->themePageDataFactory->page($request, $slug);

        if (! $payload) {
            return $this->homeController->notFound('Halaman yang kamu cari tidak tersedia.');
        }

        return $this->themeManager->render('page', $payload);
    }
}
