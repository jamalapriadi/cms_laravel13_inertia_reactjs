<?php

namespace App\Http\Controllers\Frontend;

use App\CMS\Themes\ThemeManager;
use App\CMS\Themes\ThemePageDataFactory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ProductIndexRequest;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Response;

class CategoryController extends Controller
{
    public function __construct(
        private readonly ThemeManager $themeManager,
        private readonly ThemePageDataFactory $themePageDataFactory,
        private readonly HomeController $homeController,
    ) {}

    public function show(ProductIndexRequest $request, string $slug): View|Response
    {
        $payload = $this->themePageDataFactory->categoryShow($request, $slug, $request->validated());

        if (! $payload) {
            return $this->homeController->notFound('Kategori yang kamu cari tidak tersedia.');
        }

        return $this->themeManager->render('category_show', $payload);
    }
}
