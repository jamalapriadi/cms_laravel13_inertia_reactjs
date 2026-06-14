<?php

namespace App\Http\Controllers\Frontend;

use App\CMS\Themes\ThemeManager;
use App\CMS\Themes\ThemePageDataFactory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ProductIndexRequest;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ProductController extends Controller
{
    public function __construct(
        private readonly ThemeManager $themeManager,
        private readonly ThemePageDataFactory $themePageDataFactory,
        private readonly HomeController $homeController,
    ) {}

    public function index(ProductIndexRequest $request): View
    {
        return $this->themeManager->render(
            'product_index',
            $this->themePageDataFactory->productIndex($request, $request->validated()),
        );
    }

    public function show(Request $request, string $slug): View|Response
    {
        $payload = $this->themePageDataFactory->productShow($request, $slug);

        if (! $payload) {
            return $this->homeController->notFound('Produk yang kamu cari tidak tersedia.');
        }

        return $this->themeManager->render('product_show', $payload);
    }
}
