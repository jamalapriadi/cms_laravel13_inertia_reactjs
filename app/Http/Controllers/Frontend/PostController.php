<?php

namespace App\Http\Controllers\Frontend;

use App\CMS\Themes\ThemeManager;
use App\CMS\Themes\ThemePageDataFactory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\PostIndexRequest;
use App\Http\Requests\Api\V1\PostShowRequest;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Response;

class PostController extends Controller
{
    public function __construct(
        private readonly ThemeManager $themeManager,
        private readonly ThemePageDataFactory $themePageDataFactory,
        private readonly HomeController $homeController,
    ) {}

    public function index(PostIndexRequest $request): View
    {
        return $this->themeManager->render(
            'post_index',
            $this->themePageDataFactory->postIndex($request, $request->validated()),
        );
    }

    public function show(PostShowRequest $request, string $slug): View|Response
    {
        $payload = $this->themePageDataFactory->postShow($request, $slug);

        if (! $payload) {
            return $this->homeController->notFound('Artikel yang kamu cari tidak tersedia.');
        }

        return $this->themeManager->render('post_show', $payload);
    }
}
