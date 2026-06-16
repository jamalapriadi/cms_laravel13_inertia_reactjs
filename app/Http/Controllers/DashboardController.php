<?php

namespace App\Http\Controllers;

use App\Models\ContentEntry;
use App\Models\ContentType;
use App\Models\Dashboard\Media;
use App\Models\Dashboard\Menu;
use App\Models\Page;
use App\Models\Post;
use App\Models\PostCategory;
use App\Models\Shop\BannerSlide;
use App\Models\Shop\Brand;
use App\Models\Shop\Faq;
use App\Models\Shop\Order;
use App\Models\Shop\OrderItem;
use App\Models\Shop\Payment;
use App\Models\Shop\Product;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\Supplier;
use App\Models\Shop\VariantItem;
use App\Models\Theme;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $range = $this->resolveDateRange($request);
        $previousRange = $this->resolvePreviousDateRange($range['start'], $range['end']);

        $websiteMode = get_option('website_mode', 'commerce');
        $enabledEcommerceMenus = get_option('enabled_ecommerce_menus', []);

        $showCommerce = $websiteMode !== 'blog';
        $showOrders = $showCommerce && ($websiteMode === 'commerce' || in_array('orders', $enabledEcommerceMenus));
        $showPayments = $showCommerce && ($websiteMode === 'commerce' || in_array('payments', $enabledEcommerceMenus));
        $showProducts = $showCommerce && ($websiteMode === 'commerce' || in_array('products', $enabledEcommerceMenus));
        $showStockUnits = $showCommerce && ($websiteMode === 'commerce' || in_array('product-stock-units', $enabledEcommerceMenus));
        $showBrands = $showCommerce && ($websiteMode === 'commerce' || in_array('brands', $enabledEcommerceMenus));
        $showSuppliers = $showCommerce && ($websiteMode === 'commerce' || in_array('suppliers', $enabledEcommerceMenus));

        $currentMetrics = $this->collectPeriodMetrics($range['start'], $range['end'], $showOrders, $showPayments);
        $previousMetrics = $this->collectPeriodMetrics($previousRange['start'], $previousRange['end'], $showOrders, $showPayments);

        $activeTheme = null;
        if (Schema::hasTable('themes')) {
            $activeTheme = Theme::where('is_active', true)->first(['name', 'slug', 'version', 'author']);
        }

        return Inertia::render('Dashboard/Index', [
            'filters' => [
                'date_range' => $range['key'],
                'start_date' => $range['start']->toDateString(),
                'end_date' => $range['end']->toDateString(),
                'label' => $this->formatRangeLabel($range['start'], $range['end']),
            ],
            'cms_metrics' => [
                'total_pages' => Schema::hasTable('pages') ? Page::count() : 0,
                'pages_published' => Schema::hasTable('pages') ? Page::where('status', 'publish')->count() : 0,
                'pages_draft' => Schema::hasTable('pages') ? Page::where('status', 'draft')->count() : 0,

                'total_posts' => Schema::hasTable('posts') ? Post::count() : 0,
                'posts_published' => Schema::hasTable('posts') ? Post::where('status', 'publish')->count() : 0,
                'posts_draft' => Schema::hasTable('posts') ? Post::where('status', 'draft')->count() : 0,

                'total_categories' => Schema::hasTable('post_categories') ? PostCategory::count() : 0,

                'total_media' => Schema::hasTable('media') ? Media::count() : 0,
                'media_size' => Schema::hasTable('media') ? $this->formatBytes(Media::sum('size')) : '0 B',

                'total_menus' => Schema::hasTable('menus') ? Menu::count() : 0,
                'total_faqs' => Schema::hasTable('faqs') ? Faq::count() : 0,
                'total_banner_slides' => Schema::hasTable('banner_slides') ? BannerSlide::count() : 0,
                'total_users' => Schema::hasTable('users') ? User::count() : 0,

                'active_theme' => $activeTheme,
                'dynamic_content_types' => $this->getDynamicContentTypes(),
            ],
            'recent_activity' => $this->getRecentActivity(),
            'recent_posts' => Schema::hasTable('posts') ? Post::with('author')->latest()->limit(5)->get()->map(fn ($post) => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'status' => $post->status,
                'published_at' => $post->published_at?->toISOString() ?? $post->created_at?->toISOString(),
                'author' => $post->author?->name ?? 'System',
            ])->all() : [],
            'recent_pages' => Schema::hasTable('pages') ? Page::with('creator')->latest()->limit(5)->get()->map(fn ($page) => [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'status' => $page->status,
                'published_at' => $page->published_at?->toISOString() ?? $page->created_at?->toISOString(),
                'creator' => $page->creator?->name ?? 'System',
            ])->all() : [],
            'metrics' => [
                'total_revenue' => $showOrders ? $currentMetrics['total_revenue'] : 0.0,
                'total_orders' => $showOrders ? $currentMetrics['total_orders'] : 0,
                'available_stock_units' => ($showStockUnits && Schema::hasTable('product_stock_units')) ? ProductStockUnit::where('status', 'available')->count() : 0,
                'pending_payments' => $showPayments ? $currentMetrics['pending_payments'] : 0,
                'total_products' => ($showProducts && Schema::hasTable('products')) ? Product::count() : 0,
                'total_brands' => ($showBrands && Schema::hasTable('brands')) ? Brand::count() : 0,
                'total_suppliers' => ($showSuppliers && Schema::hasTable('suppliers')) ? Supplier::count() : 0,
                'growth' => [
                    'total_revenue' => $showOrders ? $this->calculateGrowth($currentMetrics['total_revenue'], $previousMetrics['total_revenue']) : 0.0,
                    'total_orders' => $showOrders ? $this->calculateGrowth($currentMetrics['total_orders'], $previousMetrics['total_orders']) : 0.0,
                    'available_stock_units' => null,
                    'pending_payments' => $showPayments ? $this->calculateGrowth($currentMetrics['pending_payments'], $previousMetrics['pending_payments']) : 0.0,
                ],
            ],
            'charts' => [
                'revenue_growth' => $showOrders ? $this->revenueGrowthSeries($range['start'], $range['end']) : [],
                'order_status' => $showOrders ? $this->orderStatusSeries($range['start'], $range['end']) : [],
                'payment_status' => $showPayments ? $this->paymentStatusSeries($range['start'], $range['end']) : [],
                'sales_by_category' => ($showProducts && $showOrders) ? $this->salesByCategorySeries($range['start'], $range['end']) : [],
                'sales_by_brand' => ($showBrands && $showOrders) ? $this->salesByBrandSeries($range['start'], $range['end']) : [],
                'stock_unit_summary' => $showStockUnits ? $this->stockUnitSummarySeries() : [],
            ],
            'tables' => [
                'top_selling_products' => ($showProducts && $showOrders) ? $this->topSellingProducts($range['start'], $range['end']) : [],
                'low_stock_products' => $showProducts ? $this->lowStockProducts() : [],
                'recent_orders' => $showOrders ? $this->recentOrders($range['start'], $range['end']) : [],
                'pending_payments' => $showPayments ? $this->pendingPayments($range['start'], $range['end']) : [],
                'damaged_stock_units' => $showStockUnits ? $this->damagedStockUnits() : [],
            ],
        ]);
    }

    private function resolveDateRange(Request $request): array
    {
        $key = (string) $request->query('date_range', 'last_30_days');
        $today = CarbonImmutable::today();

        return match ($key) {
            'today' => [
                'key' => $key,
                'start' => $today->startOfDay(),
                'end' => $today->endOfDay(),
            ],
            'last_7_days' => [
                'key' => $key,
                'start' => $today->subDays(6)->startOfDay(),
                'end' => $today->endOfDay(),
            ],
            'this_month' => [
                'key' => $key,
                'start' => $today->startOfMonth()->startOfDay(),
                'end' => $today->endOfDay(),
            ],
            'this_year' => [
                'key' => $key,
                'start' => $today->startOfYear()->startOfDay(),
                'end' => $today->endOfDay(),
            ],
            'custom' => $this->resolveCustomDateRange($request, $today),
            default => [
                'key' => 'last_30_days',
                'start' => $today->subDays(29)->startOfDay(),
                'end' => $today->endOfDay(),
            ],
        };
    }

    private function resolveCustomDateRange(Request $request, CarbonImmutable $today): array
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        if (! $startDate || ! $endDate) {
            return [
                'key' => 'last_30_days',
                'start' => $today->subDays(29)->startOfDay(),
                'end' => $today->endOfDay(),
            ];
        }

        $start = CarbonImmutable::parse((string) $startDate)->startOfDay();
        $end = CarbonImmutable::parse((string) $endDate)->endOfDay();

        if ($end->lt($start)) {
            [$start, $end] = [$end->startOfDay(), $start->endOfDay()];
        }

        return [
            'key' => 'custom',
            'start' => $start,
            'end' => $end,
        ];
    }

    private function resolvePreviousDateRange(CarbonImmutable $start, CarbonImmutable $end): array
    {
        $days = $start->diffInDays($end) + 1;
        $previousEnd = $start->subDay()->endOfDay();
        $previousStart = $previousEnd->subDays($days - 1)->startOfDay();

        return [
            'start' => $previousStart,
            'end' => $previousEnd,
        ];
    }

    private function collectPeriodMetrics(CarbonImmutable $start, CarbonImmutable $end, bool $showOrders, bool $showPayments): array
    {
        if ((! $showOrders && ! $showPayments) || ! Schema::hasTable('orders') || ! Schema::hasTable('payments')) {
            return [
                'total_revenue' => 0.0,
                'total_orders' => 0,
                'pending_payments' => 0,
            ];
        }

        $totalRevenue = 0.0;
        $totalOrders = 0;
        $pendingPayments = 0;

        if ($showOrders && Schema::hasTable('orders')) {
            $orderQuery = Order::query()->whereBetween('created_at', [$start, $end]);
            $totalRevenue = (float) (clone $orderQuery)->where('payment_status', 'paid')->sum('grand_total');
            $totalOrders = (int) (clone $orderQuery)->count();
        }

        if ($showPayments && Schema::hasTable('payments')) {
            $pendingPayments = (int) Payment::query()
                ->where('status', 'pending')
                ->whereBetween('created_at', [$start, $end])
                ->count();
        }

        return [
            'total_revenue' => $totalRevenue,
            'total_orders' => $totalOrders,
            'pending_payments' => $pendingPayments,
        ];
    }

    private function calculateGrowth(float|int $current, float|int $previous): float
    {
        if ($previous === 0.0 || $previous === 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    private function formatRangeLabel(CarbonImmutable $start, CarbonImmutable $end): string
    {
        return $start->format('d M Y').' - '.$end->format('d M Y');
    }

    private function formatBytes(float|int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        $bytes /= pow(1024, $pow);

        return round($bytes, $precision).' '.$units[$pow];
    }

    private function getDynamicContentTypes(): array
    {
        if (! Schema::hasTable('content_types') || ! Schema::hasTable('content_entries')) {
            return [];
        }

        return ContentType::active()
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($type) => [
                'id' => $type->id,
                'name' => $type->name,
                'slug' => $type->slug,
                'icon' => $type->icon ?? 'Boxes',
                'entries_count' => $type->entries()->count(),
                'published_count' => $type->entries()->where('status', 'published')->count(),
                'draft_count' => $type->entries()->where('status', 'draft')->count(),
            ])
            ->all();
    }

    private function getRecentActivity(): array
    {
        $activities = collect();

        // 1. Pages
        if (Schema::hasTable('pages')) {
            Page::query()
                ->latest('updated_at')
                ->limit(5)
                ->get()
                ->each(function (Page $page) use ($activities) {
                    $activities->push([
                        'type' => 'page',
                        'title' => $page->title,
                        'description' => 'Halaman diupdate',
                        'status' => $page->status,
                        'time' => $page->updated_at?->toISOString() ?? $page->created_at?->toISOString(),
                        'url' => route('pages.edit', $page->id),
                    ]);
                });
        }

        // 2. Posts
        if (Schema::hasTable('posts')) {
            Post::query()
                ->latest('updated_at')
                ->limit(5)
                ->get()
                ->each(function (Post $post) use ($activities) {
                    $activities->push([
                        'type' => 'post',
                        'title' => $post->title,
                        'description' => 'Artikel diupdate',
                        'status' => $post->status,
                        'time' => $post->updated_at?->toISOString() ?? $post->created_at?->toISOString(),
                        'url' => route('posts.edit', $post->id),
                    ]);
                });
        }

        // 3. Media
        if (Schema::hasTable('media')) {
            Media::query()
                ->latest('created_at')
                ->limit(5)
                ->get()
                ->each(function (Media $media) use ($activities) {
                    $activities->push([
                        'type' => 'media',
                        'title' => $media->name ?: $media->file_name,
                        'description' => 'Media diupload: '.$media->mime_type,
                        'status' => 'success',
                        'time' => $media->created_at?->toISOString(),
                        'url' => route('dashboard.media').'?path='.urlencode(dirname($media->path ?? '')),
                    ]);
                });
        }

        // 4. Content Entries
        if (Schema::hasTable('content_entries') && Schema::hasTable('content_types')) {
            ContentEntry::query()
                ->with('contentType')
                ->latest('updated_at')
                ->limit(5)
                ->get()
                ->each(function (ContentEntry $entry) use ($activities) {
                    $activities->push([
                        'type' => 'content_entry',
                        'title' => $entry->title,
                        'description' => 'Konten dinamis diupdate: '.($entry->contentType?->name ?? 'Custom'),
                        'status' => $entry->status,
                        'time' => $entry->updated_at?->toISOString() ?? $entry->created_at?->toISOString(),
                        'url' => route('dynamic-content.edit', [$entry->contentType?->slug ?? 'default', $entry->id]),
                    ]);
                });
        }

        return $activities
            ->sortByDesc('time')
            ->take(5)
            ->values()
            ->all();
    }

    private function revenueGrowthSeries(CarbonImmutable $start, CarbonImmutable $end): array
    {
        if (! Schema::hasTable('orders')) {
            return [];
        }

        $groupByMonth = $start->diffInDays($end) > 90;
        $driver = DB::connection()->getDriverName();
        $bucketExpression = $this->timeBucketExpression($groupByMonth, $driver);

        $raw = Order::query()
            ->selectRaw("{$bucketExpression} as bucket")
            ->selectRaw('SUM(grand_total) as total')
            ->where('payment_status', 'paid')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->pluck('total', 'bucket');

        $series = [];
        $cursor = $groupByMonth ? $start->startOfMonth() : $start->startOfDay();
        $last = $groupByMonth ? $end->startOfMonth() : $end->startOfDay();

        while ($cursor->lte($last)) {
            $bucketKey = $groupByMonth ? $cursor->format('Y-m') : $cursor->format('Y-m-d');
            $label = $groupByMonth ? $cursor->format('M Y') : $cursor->format('d M');

            $series[] = [
                'name' => $label,
                'value' => (float) ($raw[$bucketKey] ?? 0),
            ];

            $cursor = $groupByMonth ? $cursor->addMonth() : $cursor->addDay();
        }

        return $series;
    }

    private function timeBucketExpression(bool $byMonth, string $driver): string
    {
        if ($byMonth) {
            return match ($driver) {
                'pgsql' => "TO_CHAR(created_at, 'YYYY-MM')",
                'sqlite' => "strftime('%Y-%m', created_at)",
                default => "DATE_FORMAT(created_at, '%Y-%m')",
            };
        }

        return match ($driver) {
            'pgsql' => "TO_CHAR(created_at, 'YYYY-MM-DD')",
            'sqlite' => "strftime('%Y-%m-%d', created_at)",
            default => 'DATE(created_at)',
        };
    }

    private function orderStatusSeries(CarbonImmutable $start, CarbonImmutable $end): array
    {
        if (! Schema::hasTable('orders')) {
            return [];
        }

        return Order::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('status')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($item) => [
                'name' => ucfirst($item->status),
                'value' => (int) $item->total,
            ])
            ->values()
            ->all();
    }

    private function paymentStatusSeries(CarbonImmutable $start, CarbonImmutable $end): array
    {
        if (! Schema::hasTable('payments')) {
            return [];
        }

        return Payment::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('status')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($item) => [
                'name' => ucfirst($item->status),
                'value' => (int) $item->total,
            ])
            ->values()
            ->all();
    }

    private function salesByCategorySeries(CarbonImmutable $start, CarbonImmutable $end): array
    {
        if (! Schema::hasTable('order_items') || ! Schema::hasTable('orders') || ! Schema::hasTable('products') || ! Schema::hasTable('categories')) {
            return [];
        }

        return OrderItem::query()
            ->selectRaw("COALESCE(categories.name, 'Uncategorized') as category_name")
            ->selectRaw('SUM(order_items.subtotal) as total')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->where('orders.payment_status', 'paid')
            ->whereBetween('orders.created_at', [$start, $end])
            ->groupBy('categories.name', 'categories.id')
            ->orderByDesc('total')
            ->limit(8)
            ->get()
            ->map(fn ($item) => [
                'name' => $item->category_name,
                'value' => (float) $item->total,
            ])
            ->values()
            ->all();
    }

    private function salesByBrandSeries(CarbonImmutable $start, CarbonImmutable $end): array
    {
        if (! Schema::hasTable('order_items') || ! Schema::hasTable('orders') || ! Schema::hasTable('products') || ! Schema::hasTable('brands')) {
            return [];
        }

        return OrderItem::query()
            ->selectRaw("COALESCE(brands.name, 'No Brand') as brand_name")
            ->selectRaw('SUM(order_items.subtotal) as total')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->leftJoin('brands', 'brands.id', '=', 'products.brand_id')
            ->where('orders.payment_status', 'paid')
            ->whereBetween('orders.created_at', [$start, $end])
            ->groupBy('brands.name', 'brands.id')
            ->orderByDesc('total')
            ->limit(8)
            ->get()
            ->map(fn ($item) => [
                'name' => $item->brand_name,
                'value' => (float) $item->total,
            ])
            ->values()
            ->all();
    }

    private function stockUnitSummarySeries(): array
    {
        if (! Schema::hasTable('product_stock_units')) {
            return [];
        }

        return ProductStockUnit::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($item) => [
                'name' => ucfirst($item->status),
                'value' => (int) $item->total,
            ])
            ->values()
            ->all();
    }

    private function topSellingProducts(CarbonImmutable $start, CarbonImmutable $end): array
    {
        if (! Schema::hasTable('order_items') || ! Schema::hasTable('orders') || ! Schema::hasTable('products')) {
            return [];
        }

        return OrderItem::query()
            ->selectRaw('order_items.product_id')
            ->selectRaw("MAX(COALESCE(order_items.product_name, products.name, '-')) as product_name")
            ->selectRaw('MAX(COALESCE(products.sku, "-")) as sku')
            ->selectRaw('SUM(order_items.qty) as sold')
            ->selectRaw('SUM(order_items.subtotal) as revenue')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->where('orders.payment_status', 'paid')
            ->whereBetween('orders.created_at', [$start, $end])
            ->groupBy('order_items.product_id')
            ->orderByDesc('sold')
            ->limit(8)
            ->get()
            ->map(fn ($item) => [
                'name' => $item->product_name,
                'sku' => $item->sku ?? '-',
                'sold' => (int) $item->sold,
                'revenue' => (float) $item->revenue,
            ])
            ->values()
            ->all();
    }

    private function lowStockProducts(): array
    {
        if (! Schema::hasTable('variant_items') || ! Schema::hasTable('products')) {
            return [];
        }

        $variantItems = VariantItem::query()
            ->with('product:id,name,sku')
            ->where('track_stock', true)
            ->where('min_stock_alert', '>', 0)
            ->whereColumn('stock', '<=', 'min_stock_alert')
            ->orderBy('stock')
            ->limit(10)
            ->get()
            ->map(function (VariantItem $variant): array {
                $threshold = max((int) floor((int) $variant->min_stock_alert / 2), 1);

                return [
                    'name' => $variant->product?->name ?? $variant->name,
                    'sku' => $variant->sku ?? $variant->product?->sku ?? '-',
                    'stock' => (int) $variant->stock,
                    'min' => (int) $variant->min_stock_alert,
                    'status' => (int) $variant->stock <= $threshold ? 'Critical' : 'Low',
                    '_score' => (int) $variant->stock,
                ];
            });

        $nonVariantProducts = Product::query()
            ->where('has_variant', false)
            ->withCount(['availableStockUnits as available_stock_units_count'])
            ->get()
            ->filter(fn (Product $product) => (int) $product->available_stock_units_count <= 5)
            ->map(function (Product $product): array {
                $stock = (int) $product->available_stock_units_count;

                return [
                    'name' => $product->name,
                    'sku' => $product->sku ?? '-',
                    'stock' => $stock,
                    'min' => 5,
                    'status' => $stock <= 2 ? 'Critical' : 'Low',
                    '_score' => $stock,
                ];
            });

        return $variantItems
            ->concat($nonVariantProducts)
            ->sortBy('_score')
            ->take(8)
            ->values()
            ->map(function (array $item): array {
                unset($item['_score']);

                return $item;
            })
            ->all();
    }

    private function recentOrders(CarbonImmutable $start, CarbonImmutable $end): array
    {
        if (! Schema::hasTable('orders')) {
            return [];
        }

        return Order::query()
            ->select([
                'id',
                'invoice_number',
                'customer_name',
                'grand_total',
                'payment_status',
                'status',
                'created_at',
            ])
            ->whereBetween('created_at', [$start, $end])
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (Order $order) => [
                'id' => $order->id,
                'order_no' => $order->invoice_number,
                'customer' => $order->customer_name ?: '-',
                'total' => (float) $order->grand_total,
                'payment' => ucfirst($order->payment_status),
                'status' => ucfirst($order->status),
                'created_at' => $order->created_at?->toISOString(),
            ])
            ->values()
            ->all();
    }

    private function pendingPayments(CarbonImmutable $start, CarbonImmutable $end): array
    {
        if (! Schema::hasTable('payments') || ! Schema::hasTable('orders')) {
            return [];
        }

        return Payment::query()
            ->with('order:id,invoice_number,customer_name')
            ->select([
                'id',
                'order_id',
                'payment_method',
                'amount',
                'status',
                'created_at',
            ])
            ->where('status', 'pending')
            ->whereBetween('created_at', [$start, $end])
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'order_no' => $payment->order?->invoice_number ?? '-',
                'customer' => $payment->order?->customer_name ?? '-',
                'amount' => (float) $payment->amount,
                'method' => $payment->payment_method ?? '-',
            ])
            ->values()
            ->all();
    }

    private function damagedStockUnits(): array
    {
        if (! Schema::hasTable('product_stock_units')) {
            return [];
        }

        return ProductStockUnit::query()
            ->with([
                'product:id,name,sku',
                'variant:id,name,sku,product_id',
                'variant.product:id,name,sku',
            ])
            ->where('status', 'damaged')
            ->latest()
            ->limit(6)
            ->get()
            ->map(function (ProductStockUnit $unit): array {
                $productName = $unit->product?->name
                    ?? $unit->variant?->product?->name
                    ?? '-';

                $sku = $unit->variant?->sku
                    ?? $unit->product?->sku
                    ?? '-';

                return [
                    'id' => $unit->id,
                    'product' => $productName,
                    'sku' => $sku,
                    'unit' => $unit->imei_serial_number ?: ($unit->barcode ?: '-'),
                ];
            })
            ->values()
            ->all();
    }
}
