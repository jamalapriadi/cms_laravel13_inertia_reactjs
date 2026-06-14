<?php

use App\Providers\AppServiceProvider;
use App\Providers\FortifyServiceProvider;
use App\Providers\ThemeServiceProvider;
use Jamalapriadi\DynamicContentBuilder\DynamicContentBuilderServiceProvider;

return [
    AppServiceProvider::class,
    FortifyServiceProvider::class,
    ThemeServiceProvider::class,
    DynamicContentBuilderServiceProvider::class,
];
