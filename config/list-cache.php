<?php

use App\Models\Block;
use App\Models\BlockTranslation;
use App\Models\Brand;
use App\Models\ContentEntry;
use App\Models\ContentEntryTranslation;
use App\Models\ContentType;
use App\Models\CustomField;
use App\Models\CustomFieldGroup;
use App\Models\Dashboard\Kabupaten;
use App\Models\Dashboard\Kecamatan;
use App\Models\Dashboard\Kelurahan;
use App\Models\Dashboard\Language;
use App\Models\Dashboard\Menu;
use App\Models\Dashboard\MenuItem;
use App\Models\Dashboard\MenuItemTranslation;
use App\Models\Dashboard\Option;
use App\Models\Dashboard\Province;
use App\Models\Dashboard\Template;
use App\Models\Dashboard\Translation;
use App\Models\Package;
use App\Models\Page;
use App\Models\PageTranslation;
use App\Models\Post;
use App\Models\PostCategory;
use App\Models\PostMeta;
use App\Models\PostTranslation;
use App\Models\Shop\BannerSlide;
use App\Models\Shop\Brand as ShopBrand;
use App\Models\Shop\Cart;
use App\Models\Shop\CartItem;
use App\Models\Shop\Category;
use App\Models\Shop\Customer;
use App\Models\Shop\Faq;
use App\Models\Shop\IncomingGoods;
use App\Models\Shop\IncomingGoodsItem;
use App\Models\Shop\Order;
use App\Models\Shop\OrderItem;
use App\Models\Shop\Payment;
use App\Models\Shop\Product;
use App\Models\Shop\ProductCollection;
use App\Models\Shop\ProductCollectionItem;
use App\Models\Shop\ProductImage;
use App\Models\Shop\ProductSpecification;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\ProductVariant;
use App\Models\Shop\ProductVariantOption;
use App\Models\Shop\Shipping;
use App\Models\Shop\SiteContent;
use App\Models\Shop\SiteContentTranslation;
use App\Models\Shop\StockMovement;
use App\Models\Shop\Supplier;
use App\Models\Shop\SupplierReturn;
use App\Models\Shop\SupplierReturnItem;
use App\Models\Shop\VariantItem;
use App\Models\Term;
use App\Models\TermTaxonomy;
use App\Models\Unit;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return [
    'enabled' => env('LIST_CACHE_ENABLED', true),

    'default_ttl' => (int) env('LIST_CACHE_TTL', 900),

    'prefix' => env('LIST_CACHE_PREFIX', 'list-cache'),

    'taggable_stores' => ['redis', 'memcached'],

    'modules' => [
        'api.banner-slides' => ['ttl' => 1800],
        'api.brands' => ['ttl' => 1800],
        'api.categories' => ['ttl' => 1800],
        'api.dynamic-content' => ['ttl' => 900],
        'api.menus' => ['ttl' => 1800],
        'api.options.all' => ['ttl' => 1800],
        'api.options.general' => ['ttl' => 1800],
        'api.options.preferences' => ['ttl' => 1800],
        'api.orders' => ['ttl' => 300],
        'api.pages' => ['ttl' => 900],
        'api.posts' => ['ttl' => 900],
        'api.product-collections' => ['ttl' => 900],
        'api.products' => ['ttl' => 600],
        'api.site-contents' => ['ttl' => 3600],
        'api.site-config' => ['ttl' => 1800],
        'banner-slides' => ['ttl' => 900],
        'brands' => ['ttl' => 1800],
        'carts' => ['ttl' => 300],
        'categories' => ['ttl' => 1800],
        'content-types' => ['ttl' => 600],
        'custom-field-groups' => ['ttl' => 600],
        'customers' => ['ttl' => 300],
        'faqs' => ['ttl' => 1800],
        'incoming-goods' => ['ttl' => 300],
        'menus' => ['ttl' => 1800],
        'orders' => ['ttl' => 300],
        'options' => ['ttl' => 1800],
        'pages' => ['ttl' => 600],
        'packages' => ['ttl' => 900],
        'payments' => ['ttl' => 300],
        'permissions' => ['ttl' => 1800],
        'post-categories' => ['ttl' => 1800],
        'posts' => ['ttl' => 600],
        'product-collections' => ['ttl' => 900],
        'product-images' => ['ttl' => 900],
        'product-specifications' => ['ttl' => 900],
        'product-stock-units' => ['ttl' => 300],
        'product-variants' => ['ttl' => 900],
        'products' => ['ttl' => 600],
        'roles' => ['ttl' => 1800],
        'search-options' => ['ttl' => 900],
        'shipping' => ['ttl' => 300],
        'site-contents' => ['ttl' => 1800],
        'stock-movements' => ['ttl' => 300],
        'supplier-returns' => ['ttl' => 300],
        'suppliers' => ['ttl' => 1800],
        'taxonomies' => ['ttl' => 1800],
        'templates' => ['ttl' => 1800],
        'translations' => ['ttl' => 1800],
        'units' => ['ttl' => 1800],
        'users' => ['ttl' => 600],
        'variant-items' => ['ttl' => 900],
        'wilayah' => ['ttl' => 3600],
    ],

    'invalidation' => [
        BannerSlide::class => ['api.banner-slides', 'banner-slides'],
        Block::class => ['api.pages', 'api.posts', 'pages', 'posts'],
        BlockTranslation::class => ['api.pages', 'api.posts', 'pages', 'posts'],
        Brand::class => ['api.brands', 'api.product-collections', 'api.products', 'brands', 'products', 'product-collections', 'search-options'],
        ShopBrand::class => ['api.brands', 'api.product-collections', 'api.products', 'brands', 'products', 'product-collections', 'search-options'],
        Cart::class => ['carts'],
        CartItem::class => ['carts'],
        Category::class => ['api.categories', 'api.product-collections', 'api.products', 'categories', 'products', 'product-collections', 'search-options'],
        ContentEntry::class => ['api.dynamic-content', 'content-types'],
        ContentEntryTranslation::class => ['api.dynamic-content'],
        ContentType::class => ['api.dynamic-content', 'content-types'],
        CustomField::class => ['api.dynamic-content', 'custom-field-groups', 'content-types'],
        CustomFieldGroup::class => ['api.dynamic-content', 'custom-field-groups', 'content-types'],
        Customer::class => ['api.orders', 'carts', 'customers', 'orders'],
        Faq::class => ['faqs'],
        IncomingGoods::class => ['incoming-goods', 'product-stock-units', 'stock-movements'],
        IncomingGoodsItem::class => ['incoming-goods', 'product-stock-units', 'stock-movements'],
        Kabupaten::class => ['wilayah'],
        Kecamatan::class => ['wilayah'],
        Kelurahan::class => ['wilayah'],
        Language::class => ['api.dynamic-content', 'api.pages', 'api.posts', 'api.site-contents', 'api.site-config', 'pages', 'posts', 'site-contents', 'translations'],
        Menu::class => ['api.menus', 'menus'],
        MenuItem::class => ['api.menus', 'menus'],
        MenuItemTranslation::class => ['api.menus', 'menus'],
        Option::class => ['api.dynamic-content', 'api.options.all', 'api.options.general', 'api.options.preferences', 'api.site-contents', 'api.site-config', 'options', 'site-contents'],
        Order::class => ['api.orders', 'orders', 'payments', 'shipping', 'stock-movements'],
        OrderItem::class => ['api.orders', 'api.products', 'orders', 'products'],
        Package::class => ['packages'],
        Page::class => ['api.pages', 'pages'],
        PageTranslation::class => ['api.pages', 'pages'],
        Payment::class => ['orders', 'payments'],
        Post::class => ['api.posts', 'posts'],
        PostCategory::class => ['api.posts', 'post-categories', 'posts'],
        PostMeta::class => ['api.posts', 'posts'],
        PostTranslation::class => ['api.posts', 'posts'],
        Product::class => ['api.product-collections', 'api.products', 'products', 'product-collections', 'product-images', 'product-specifications', 'product-stock-units', 'product-variants', 'search-options', 'variant-items'],
        ProductCollection::class => ['api.product-collections', 'api.products', 'product-collections', 'products'],
        ProductCollectionItem::class => ['api.product-collections', 'api.products', 'product-collections', 'products'],
        ProductImage::class => ['api.product-collections', 'api.products', 'product-images', 'products'],
        ProductSpecification::class => ['api.products', 'product-specifications', 'products'],
        ProductStockUnit::class => ['api.product-collections', 'api.products', 'product-stock-units', 'products', 'search-options', 'stock-movements', 'supplier-returns'],
        ProductVariant::class => ['api.products', 'product-variants', 'products'],
        ProductVariantOption::class => ['api.products', 'product-variants', 'products', 'search-options', 'variant-items'],
        Province::class => ['wilayah'],
        Role::class => ['roles', 'users'],
        Permission::class => ['permissions', 'roles', 'users'],
        Shipping::class => ['orders', 'shipping'],
        SiteContent::class => ['api.site-contents', 'api.site-config', 'site-contents'],
        SiteContentTranslation::class => ['api.site-contents', 'api.site-config', 'site-contents'],
        StockMovement::class => ['product-stock-units', 'stock-movements'],
        Supplier::class => ['incoming-goods', 'supplier-returns', 'suppliers', 'search-options'],
        SupplierReturn::class => ['product-stock-units', 'stock-movements', 'supplier-returns'],
        SupplierReturnItem::class => ['product-stock-units', 'stock-movements', 'supplier-returns'],
        Template::class => ['templates'],
        Term::class => ['api.posts', 'posts', 'taxonomies'],
        TermTaxonomy::class => ['api.posts', 'posts', 'taxonomies'],
        Translation::class => ['translations'],
        Unit::class => ['products', 'units', 'variant-items', 'search-options'],
        User::class => ['roles', 'users'],
        VariantItem::class => ['api.product-collections', 'api.products', 'product-stock-units', 'products', 'search-options', 'stock-movements', 'variant-items'],
    ],
];
