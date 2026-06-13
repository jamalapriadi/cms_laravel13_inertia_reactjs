<?php

use App\Providers\AppServiceProvider;
use App\Providers\FortifyServiceProvider;
use Jamalapriadi\DynamicContentBuilder\DynamicContentBuilderServiceProvider;

return [
    AppServiceProvider::class,
    FortifyServiceProvider::class,
    DynamicContentBuilderServiceProvider::class,
];
