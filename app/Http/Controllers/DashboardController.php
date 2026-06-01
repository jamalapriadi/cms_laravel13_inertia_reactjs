<?php

namespace App\Http\Controllers;

use App\Models\Shop\Order;
use App\Models\Shop\OrderItem;
use App\Models\Shop\Payment;
use App\Models\Shop\Product;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\VariantItem;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $range = $this->resolveDateRange($request);
        $previousRange = $this->resolvePreviousDateRange($range['start'], $range['end']);

        $currentMetrics = $this->collectPeriodMetrics($range['start'], $range['end']);
        $previousMetrics = $this->collectPeriodMetrics($previousRange['start'], $previousRange['end']);

        return Inertia::render('Dashboard/Index', [
            'filters' => [
                'date_range' => $range['key'],
                'start_date' => $range['start']->toDateString(),
                'end_date' => $range['end']->toDateString(),
                'label' => $this->formatRangeLabel($range['start'], $range['end']),
            ],
            'metrics' => [
                'total_revenue' => $currentMetrics['total_revenue'],
                'total_orders' => $currentMetrics['total_orders'],
                'available_stock_units' => ProductStockUnit::where('status', 'available')->count(),
                'pending_payments' => $currentMetrics['pending_payments'],
                'growth' => [
                    'total_revenue' => $this->calculateGrowth($currentMetrics['total_revenue'], $previousMetrics['total_revenue']),
                    'total_orders' => $this->calculateGrowth($currentMetrics['total_orders'], $previousMetrics['total_orders']),
                    'available_stock_units' => null,
                    'pending_payments' => $this->calculateGrowth($currentMetrics['pending_payments'], $previousMetrics['pending_payments']),
                ],
            ],
            'charts' => [
                'revenue_growth' => $this->revenueGrowthSeries($range['start'], $range['end']),
                'order_status' => $this->orderStatusSeries($range['start'], $range['end']),
                'payment_status' => $this->paymentStatusSeries($range['start'], $range['end']),
                'sales_by_category' => $this->salesByCategorySeries($range['start'], $range['end']),
                'sales_by_brand' => $this->salesByBrandSeries($range['start'], $range['end']),
                'stock_unit_summary' => $this->stockUnitSummarySeries(),
            ],
            'tables' => [
                'top_selling_products' => $this->topSellingProducts($range['start'], $range['end']),
                'low_stock_products' => $this->lowStockProducts(),
                'recent_orders' => $this->recentOrders($range['start'], $range['end']),
                'pending_payments' => $this->pendingPayments($range['start'], $range['end']),
                'damaged_stock_units' => $this->damagedStockUnits(),
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

    private function collectPeriodMetrics(CarbonImmutable $start, CarbonImmutable $end): array
    {
        $orderQuery = Order::query()->whereBetween('created_at', [$start, $end]);

        return [
            'total_revenue' => (float) (clone $orderQuery)->where('payment_status', 'paid')->sum('grand_total'),
            'total_orders' => (int) (clone $orderQuery)->count(),
            'pending_payments' => (int) Payment::query()
                ->where('status', 'pending')
                ->whereBetween('created_at', [$start, $end])
                ->count(),
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

    private function revenueGrowthSeries(CarbonImmutable $start, CarbonImmutable $end): array
    {
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
        return OrderItem::query()
            ->selectRaw("COALESCE(categories.name, 'Uncategorized') as name")
            ->selectRaw('SUM(order_items.subtotal) as total')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->where('orders.payment_status', 'paid')
            ->whereBetween('orders.created_at', [$start, $end])
            ->groupBy('name')
            ->orderByDesc('total')
            ->limit(8)
            ->get()
            ->map(fn ($item) => [
                'name' => $item->name,
                'value' => (float) $item->total,
            ])
            ->values()
            ->all();
    }

    private function salesByBrandSeries(CarbonImmutable $start, CarbonImmutable $end): array
    {
        return OrderItem::query()
            ->selectRaw("COALESCE(brands.name, 'No Brand') as name")
            ->selectRaw('SUM(order_items.subtotal) as total')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->leftJoin('brands', 'brands.id', '=', 'products.brand_id')
            ->where('orders.payment_status', 'paid')
            ->whereBetween('orders.created_at', [$start, $end])
            ->groupBy('name')
            ->orderByDesc('total')
            ->limit(8)
            ->get()
            ->map(fn ($item) => [
                'name' => $item->name,
                'value' => (float) $item->total,
            ])
            ->values()
            ->all();
    }

    private function stockUnitSummarySeries(): array
    {
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
                    'grade' => $unit->grade ?: '-',
                    'battery' => $unit->battery_health,
                ];
            })
            ->values()
            ->all();
    }
}
