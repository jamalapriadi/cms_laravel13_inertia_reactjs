import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Boxes,
    CreditCard,
    DollarSign,
    ShoppingCart,
    FileText,
    FolderOpen,
    Menu,
    Layers,
    HelpCircle,
    Image,
    Users,
    Palette,
    Activity,
    Plus,
    ArrowRight,
    Settings,
    ExternalLink,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { dashboard } from '@/routes';

interface Filters {
    date_range: string;
    start_date: string;
    end_date: string;
    label: string;
}

interface CmsMetrics {
    total_pages: number;
    pages_published: number;
    pages_draft: number;

    total_posts: number;
    posts_published: number;
    posts_draft: number;

    total_categories: number;

    total_media: number;
    media_size: string;

    total_menus: number;
    total_faqs: number;
    total_banner_slides: number;
    total_users: number;

    active_theme: {
        name: string;
        slug: string;
        version: string;
        author: string;
    } | null;
    dynamic_content_types: {
        id: string;
        name: string;
        slug: string;
        icon: string;
        entries_count: number;
        published_count: number;
        draft_count: number;
    }[];
}

interface ActivityItem {
    type: 'page' | 'post' | 'media' | 'content_entry';
    title: string;
    description: string;
    status: string;
    time: string;
    url: string;
}

interface RecentPostItem {
    id: number;
    title: string;
    slug: string;
    status: string;
    published_at: string;
    author: string;
}

interface RecentPageItem {
    id: number;
    title: string;
    slug: string;
    status: string;
    published_at: string;
    creator: string;
}

interface Metrics {
    total_revenue: number;
    total_orders: number;
    available_stock_units: number;
    pending_payments: number;
    total_products: number;
    total_brands: number;
    total_suppliers: number;
    growth: {
        total_revenue: number;
        total_orders: number;
        available_stock_units: number | null;
        pending_payments: number;
    };
}

interface ChartItem {
    name: string;
    value: number;
}

interface TopSellingProduct {
    name: string;
    sku: string;
    sold: number;
    revenue: number;
}

interface LowStockProduct {
    name: string;
    sku: string;
    stock: number;
    min: number;
    status: 'Critical' | 'Low';
}

interface RecentOrder {
    id: string;
    order_no: string;
    customer: string;
    total: number;
    payment: string;
    status: string;
    created_at: string | null;
}

interface PendingPayment {
    id: string;
    order_no: string;
    customer: string;
    amount: number;
    method: string;
}

interface DamagedStockUnit {
    id: string;
    product: string;
    sku: string;
    unit: string;
    grade: string;
    battery: number | null;
}

interface Tables {
    top_selling_products: TopSellingProduct[];
    low_stock_products: LowStockProduct[];
    recent_orders: RecentOrder[];
    pending_payments: PendingPayment[];
    damaged_stock_units: DamagedStockUnit[];
}

interface Props {
    filters: Filters;
    cms_metrics: CmsMetrics;
    recent_activity: ActivityItem[];
    recent_posts: RecentPostItem[];
    recent_pages: RecentPageItem[];
    metrics: Metrics;
    charts: {
        revenue_growth: ChartItem[];
        order_status: ChartItem[];
        payment_status: ChartItem[];
        sales_by_category: ChartItem[];
        sales_by_brand: ChartItem[];
        stock_unit_summary: ChartItem[];
    };
    tables: Tables;
}

const dateRangeOptions = [
    { label: 'Hari Ini', value: 'today' },
    { label: '7 Hari Terakhir', value: 'last_7_days' },
    { label: '30 Hari Terakhir', value: 'last_30_days' },
    { label: 'Bulan Ini', value: 'this_month' },
    { label: 'Tahun Ini', value: 'this_year' },
];

const piePalette = [
    '#16a34a',
    '#2563eb',
    '#f59e0b',
    '#dc2626',
    '#14b8a6',
    '#7c3aed',
];

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value || 0);

const formatNumber = (value: number) => (value || 0).toLocaleString('id-ID');

const formatGrowth = (value: number | null) => {
    if (value === null) {
        return { label: 'N/A', positive: true };
    }

    const positive = value >= 0;
    const prefix = positive ? '+' : '';

    return {
        label: `${prefix}${value.toFixed(1)}%`,
        positive,
    };
};

function ChartLegend({ data }: { data: (ChartItem & { color: string })[] }) {
    return (
        <div className="mt-3 flex flex-wrap gap-3">
            {data.map((item) => (
                <div
                    key={item.name}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                    <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                    <span className="font-medium text-foreground">
                        {formatNumber(item.value)}
                    </span>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            {text}
        </p>
    );
}

export default function Dashboard({
    filters,
    cms_metrics,
    recent_activity,
    recent_posts,
    recent_pages,
    metrics,
    charts,
    tables,
}: Props) {
    const { props } = usePage();
    const websiteMode = (props.website_mode as string) || 'commerce';
    const enabledEcommerceMenus = Array.isArray(props.enabled_ecommerce_menus)
        ? (props.enabled_ecommerce_menus as string[])
        : [];

    const showCommerce = websiteMode !== 'blog';
    const showOrders = showCommerce && (websiteMode === 'commerce' || enabledEcommerceMenus.includes('orders'));
    const showPayments = showCommerce && (websiteMode === 'commerce' || enabledEcommerceMenus.includes('payments'));
    const showProducts = showCommerce && (websiteMode === 'commerce' || enabledEcommerceMenus.includes('products'));
    const showStockUnits = showCommerce && (websiteMode === 'commerce' || enabledEcommerceMenus.includes('product-stock-units'));
    const showBrands = showCommerce && (websiteMode === 'commerce' || enabledEcommerceMenus.includes('brands'));

    const showEcommerceTab = showCommerce && (enabledEcommerceMenus.length > 0 || websiteMode === 'commerce');

    const [dateRange, setDateRange] = useState(
        filters.date_range || 'last_30_days',
    );
    const [activeTab, setActiveTab] = useState<'cms' | 'ecommerce'>('cms');

    const currentTab = showEcommerceTab ? activeTab : 'cms';

    const orderStatusData = useMemo(
        () =>
            (charts.order_status || []).map((item, index) => ({
                ...item,
                color: piePalette[index % piePalette.length],
            })),
        [charts.order_status],
    );

    const paymentStatusData = useMemo(
        () =>
            (charts.payment_status || []).map((item, index) => ({
                ...item,
                color: piePalette[index % piePalette.length],
            })),
        [charts.payment_status],
    );

    const totalOrderStatus = useMemo(
        () =>
            (charts.order_status || []).reduce(
                (acc, item) => acc + item.value,
                0,
            ),
        [charts.order_status],
    );

    const totalPaymentStatus = useMemo(
        () =>
            (charts.payment_status || []).reduce(
                (acc, item) => acc + item.value,
                0,
            ),
        [charts.payment_status],
    );

    const kpiCards = [
        showOrders && {
            title: 'Total Revenue',
            value: formatCurrency(metrics.total_revenue),
            growth: formatGrowth(metrics.growth.total_revenue),
            description: `Periode ${filters.label}`,
            icon: DollarSign,
        },
        showOrders && {
            title: 'Total Orders',
            value: formatNumber(metrics.total_orders),
            growth: formatGrowth(metrics.growth.total_orders),
            description: `Order masuk pada ${filters.label}`,
            icon: ShoppingCart,
        },
        showStockUnits && {
            title: 'Available Stock Unit',
            value: formatNumber(metrics.available_stock_units),
            growth: formatGrowth(metrics.growth.available_stock_units),
            description: 'Snapshot unit siap jual saat ini',
            icon: Boxes,
        },
        showPayments && {
            title: 'Pending Payments',
            value: formatNumber(metrics.pending_payments),
            growth: formatGrowth(metrics.growth.pending_payments),
            description: `Menunggu pembayaran pada ${filters.label}`,
            icon: CreditCard,
        },
    ].filter(Boolean) as {
        title: string;
        value: string;
        growth: { label: string; positive: boolean };
        description: string;
        icon: React.ElementType;
    }[];

    const handleDateRangeChange = (value: string) => {
        setDateRange(value);

        router.get(
            dashboard.url(),
            { date_range: value },
            {
                preserveState: true,
                replace: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <>
            <Head title="CMS Dashboard" />

            <div className="space-y-6 p-4 md:p-6">

                {/* Navigation and Date Filters */}
                <div className="flex flex-col gap-4 rounded-xl border bg-card p-3 shadow-sm md:flex-row md:items-center md:justify-between">
                    {showEcommerceTab ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('cms')}
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                                    currentTab === 'cms'
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                <Layers className="h-4 w-4" />
                                CMS & Konten Website
                            </button>
                            <button
                                onClick={() => setActiveTab('ecommerce')}
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                                    currentTab === 'ecommerce'
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                <ShoppingCart className="h-4 w-4" />
                                E-Commerce
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 text-sm font-semibold text-foreground">
                            <Layers className="h-4 w-4 text-blue-600 animate-pulse" />
                            CMS & Konten Website (Blog Only Mode)
                        </div>
                    )}

                    <div className="flex w-full items-center gap-3 md:w-auto">
                        <span className="hidden text-xs font-medium text-muted-foreground lg:inline">
                            Periode: {filters.label}
                        </span>
                        <div className="w-full md:w-48">
                            <Select
                                value={dateRange}
                                onValueChange={handleDateRangeChange}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Rentang Tanggal" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dateRangeOptions.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Render active tab content */}
                {currentTab === 'cms' ? (
                    <div className="space-y-6">
                        {/* Quick Actions Card */}
                        <Card className="rounded-2xl border border-muted/80 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg font-semibold">
                                    Aksi Cepat (Quick Actions)
                                </CardTitle>
                                <CardDescription>
                                    Shortcut cepat untuk manajemen data dan
                                    konten website
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                                <a
                                    href="/my-admin/dashboard/posts/create"
                                    className="flex flex-col items-center justify-center rounded-xl border bg-card p-4 text-center shadow-sm transition-all hover:bg-accent hover:text-accent-foreground hover:shadow"
                                >
                                    <div className="rounded-full bg-blue-100 p-2.5 text-blue-600">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <span className="mt-2 text-xs font-semibold">
                                        Tulis Artikel
                                    </span>
                                </a>
                                <a
                                    href="/my-admin/dashboard/pages/create"
                                    className="flex flex-col items-center justify-center rounded-xl border bg-card p-4 text-center shadow-sm transition-all hover:bg-accent hover:text-accent-foreground hover:shadow"
                                >
                                    <div className="rounded-full bg-emerald-100 p-2.5 text-emerald-600">
                                        <Layers className="h-5 w-5" />
                                    </div>
                                    <span className="mt-2 text-xs font-semibold">
                                        Buat Halaman
                                    </span>
                                </a>
                                <a
                                    href="/my-admin/dashboard/media"
                                    className="flex flex-col items-center justify-center rounded-xl border bg-card p-4 text-center shadow-sm transition-all hover:bg-accent hover:text-accent-foreground hover:shadow"
                                >
                                    <div className="rounded-full bg-amber-100 p-2.5 text-amber-600">
                                        <Image className="h-5 w-5" />
                                    </div>
                                    <span className="mt-2 text-xs font-semibold">
                                        Upload Media
                                    </span>
                                </a>
                                <a
                                    href="/my-admin/dashboard/menus"
                                    className="flex flex-col items-center justify-center rounded-xl border bg-card p-4 text-center shadow-sm transition-all hover:bg-accent hover:text-accent-foreground hover:shadow"
                                >
                                    <div className="rounded-full bg-indigo-100 p-2.5 text-indigo-600">
                                        <Menu className="h-5 w-5" />
                                    </div>
                                    <span className="mt-2 text-xs font-semibold">
                                        Kelola Menu
                                    </span>
                                </a>
                                <a
                                    href="/my-admin/dashboard/ecommerce/faqs"
                                    className="flex flex-col items-center justify-center rounded-xl border bg-card p-4 text-center shadow-sm transition-all hover:bg-accent hover:text-accent-foreground hover:shadow"
                                >
                                    <div className="rounded-full bg-rose-100 p-2.5 text-rose-600">
                                        <HelpCircle className="h-5 w-5" />
                                    </div>
                                    <span className="mt-2 text-xs font-semibold">
                                        Kelola FAQ
                                    </span>
                                </a>
                                <a
                                    href="/my-admin/dashboard/themes"
                                    className="flex flex-col items-center justify-center rounded-xl border bg-card p-4 text-center shadow-sm transition-all hover:bg-accent hover:text-accent-foreground hover:shadow"
                                >
                                    <div className="rounded-full bg-violet-100 p-2.5 text-violet-600">
                                        <Palette className="h-5 w-5" />
                                    </div>
                                    <span className="mt-2 text-xs font-semibold">
                                        Kustom Tema
                                    </span>
                                </a>
                            </CardContent>
                        </Card>

                        {/* Primary CMS Metrics Grid */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Card className="rounded-2xl border border-muted/80 shadow-sm transition-shadow hover:shadow-md">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardDescription className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Halaman
                                        </CardDescription>
                                        <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                                            <Layers className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <CardTitle className="mt-2 text-3xl font-bold">
                                        {formatNumber(cms_metrics.total_pages)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex gap-3 pt-0 text-xs text-muted-foreground">
                                    <span className="font-semibold text-emerald-600">
                                        {formatNumber(
                                            cms_metrics.pages_published,
                                        )}{' '}
                                        Published
                                    </span>
                                    <span>&bull;</span>
                                    <span className="font-semibold text-amber-600">
                                        {formatNumber(cms_metrics.pages_draft)}{' '}
                                        Draft
                                    </span>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border border-muted/80 shadow-sm transition-shadow hover:shadow-md">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardDescription className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Artikel / Blog
                                        </CardDescription>
                                        <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <CardTitle className="mt-2 text-3xl font-bold">
                                        {formatNumber(cms_metrics.total_posts)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex gap-3 pt-0 text-xs text-muted-foreground">
                                    <span className="font-semibold text-emerald-600">
                                        {formatNumber(
                                            cms_metrics.posts_published,
                                        )}{' '}
                                        Published
                                    </span>
                                    <span>&bull;</span>
                                    <span className="font-semibold text-amber-600">
                                        {formatNumber(cms_metrics.posts_draft)}{' '}
                                        Draft
                                    </span>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border border-muted/80 shadow-sm transition-shadow hover:shadow-md">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardDescription className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Media Library
                                        </CardDescription>
                                        <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                                            <Image className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <CardTitle className="mt-2 text-3xl font-bold">
                                        {formatNumber(cms_metrics.total_media)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 text-xs text-muted-foreground">
                                    <span className="font-semibold text-foreground">
                                        Ukuran: {cms_metrics.media_size}
                                    </span>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border border-muted/80 shadow-sm transition-shadow hover:shadow-md">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardDescription className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Kategori Artikel
                                        </CardDescription>
                                        <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                                            <FolderOpen className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <CardTitle className="mt-2 text-3xl font-bold">
                                        {formatNumber(
                                            cms_metrics.total_categories,
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 text-xs text-muted-foreground">
                                    <span>Pengelompokan artikel blog</span>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Secondary CMS Metrics Grid */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Card className="rounded-2xl border border-muted/80 shadow-sm">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase">
                                            Menu Navigasi
                                        </span>
                                        <Menu className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <CardTitle className="mt-2 text-lg font-bold">
                                        {cms_metrics.total_menus} Menu
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 text-xs text-muted-foreground">
                                    <span>Struktur navigasi utama web</span>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border border-muted/80 shadow-sm">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase">
                                            Banner Slide
                                        </span>
                                        <Image className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <CardTitle className="mt-2 text-lg font-bold">
                                        {cms_metrics.total_banner_slides}{' '}
                                        Banners
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 text-xs text-muted-foreground">
                                    <span>Banner promosi / carousels</span>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border border-muted/80 shadow-sm">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase">
                                            FAQ Website
                                        </span>
                                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <CardTitle className="mt-2 text-lg font-bold">
                                        {cms_metrics.total_faqs} Pertanyaan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 text-xs text-muted-foreground">
                                    <span>Tanya Jawab</span>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border border-muted/80 shadow-sm">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase">
                                            Tema Aktif
                                        </span>
                                        <Palette className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <CardTitle className="text-md mt-2 truncate font-bold">
                                        {cms_metrics.active_theme
                                            ? cms_metrics.active_theme.name
                                            : 'Default Theme'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 text-xs text-muted-foreground">
                                    <span>
                                        v
                                        {cms_metrics.active_theme
                                            ? cms_metrics.active_theme.version
                                            : '1.0'}{' '}
                                        &bull;{' '}
                                        {cms_metrics.active_theme
                                            ? cms_metrics.active_theme.author
                                            : 'SafarTranss'}
                                    </span>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Dynamic Custom Content Types */}
                        {cms_metrics.dynamic_content_types &&
                            cms_metrics.dynamic_content_types.length > 0 && (
                                <Card className="rounded-2xl border border-muted/80 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                            <Boxes className="h-5 w-5 text-indigo-600" />
                                            Konten Dinamis Custom (Company
                                            Profile)
                                        </CardTitle>
                                        <CardDescription>
                                            Modul dinamis khusus yang
                                            ditambahkan di CMS
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {cms_metrics.dynamic_content_types.map(
                                                (type) => (
                                                    <div
                                                        key={type.id}
                                                        className="flex flex-col justify-between rounded-xl border p-4 transition-shadow hover:shadow-sm"
                                                    >
                                                        <div>
                                                            <h4 className="text-base font-semibold">
                                                                {type.name}
                                                            </h4>
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                Slug:{' '}
                                                                {type.slug}
                                                            </p>
                                                            <div className="mt-3 flex gap-3 text-xs">
                                                                <span className="font-semibold text-indigo-600">
                                                                    {
                                                                        type.entries_count
                                                                    }{' '}
                                                                    Total
                                                                </span>
                                                                <span>
                                                                    &bull;
                                                                </span>
                                                                <span className="text-emerald-600">
                                                                    {
                                                                        type.published_count
                                                                    }{' '}
                                                                    Published
                                                                </span>
                                                                <span>
                                                                    &bull;
                                                                </span>
                                                                <span className="text-amber-600">
                                                                    {
                                                                        type.draft_count
                                                                    }{' '}
                                                                    Draft
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <a
                                                            href={`/my-admin/dashboard/dynamic-content/${type.slug}`}
                                                            className="mt-4 flex items-center justify-center gap-1 rounded-lg bg-muted py-1.5 text-xs font-semibold transition-colors hover:bg-accent"
                                                        >
                                                            Kelola Konten{' '}
                                                            <ArrowRight className="h-3 w-3" />
                                                        </a>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                        {/* Bottom Sections: Activity Feed & Contents list */}
                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                            {/* Activity Feed */}
                            <Card className="rounded-2xl border border-muted/80 shadow-sm xl:col-span-7">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                        <Activity className="h-5 w-5 text-blue-600" />
                                        Aktivitas Konten Terbaru
                                    </CardTitle>
                                    <CardDescription>
                                        Perubahan terakhir pada database CMS
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {recent_activity &&
                                        recent_activity.length > 0 ? (
                                            recent_activity.map(
                                                (act, index) => {
                                                    const dateStr = act.time
                                                        ? new Date(
                                                              act.time,
                                                          ).toLocaleDateString(
                                                              'id-ID',
                                                              {
                                                                  day: 'numeric',
                                                                  month: 'short',
                                                                  hour: '2-digit',
                                                                  minute: '2-digit',
                                                              },
                                                          )
                                                        : '-';

                                                    return (
                                                        <div
                                                            key={index}
                                                            className="flex items-start gap-3 rounded-xl border border-muted/60 bg-muted/10 p-3 transition-all duration-150 hover:bg-muted/20"
                                                        >
                                                            <div className="mt-0.5 rounded-xl border bg-card p-2">
                                                                {act.type ===
                                                                    'page' && (
                                                                    <Layers className="h-4 w-4 text-blue-600" />
                                                                )}
                                                                {act.type ===
                                                                    'post' && (
                                                                    <FileText className="h-4 w-4 text-emerald-600" />
                                                                )}
                                                                {act.type ===
                                                                    'media' && (
                                                                    <Image className="h-4 w-4 text-amber-600" />
                                                                )}
                                                                {act.type ===
                                                                    'content_entry' && (
                                                                    <Boxes className="h-4 w-4 text-indigo-600" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <p className="truncate text-sm font-semibold">
                                                                        {
                                                                            act.title
                                                                        }
                                                                    </p>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-[10px] font-bold tracking-wider uppercase"
                                                                    >
                                                                        {
                                                                            act.status
                                                                        }
                                                                    </Badge>
                                                                </div>
                                                                <p className="mt-1 text-xs text-muted-foreground">
                                                                    {
                                                                        act.description
                                                                    }
                                                                </p>
                                                                <p className="mt-2 text-[10px] text-muted-foreground">
                                                                    {dateStr}
                                                                </p>
                                                            </div>
                                                            <a
                                                                href={act.url}
                                                                className="ml-2 flex items-center gap-0.5 self-center text-xs font-semibold text-primary hover:underline"
                                                            >
                                                                Edit{' '}
                                                                <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        </div>
                                                    );
                                                },
                                            )
                                        ) : (
                                            <EmptyState text="Belum ada aktivitas konten terbaru." />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Mini System Info */}
                            <Card className="flex flex-col justify-between rounded-2xl border border-muted/80 shadow-sm xl:col-span-5">
                                <div>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                            <Settings className="h-5 w-5 text-indigo-600" />
                                            Konfigurasi Sistem
                                        </CardTitle>
                                        <CardDescription>
                                            Status setup website SafarTranss
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between rounded-lg border p-3">
                                            <div>
                                                <p className="text-sm font-semibold">
                                                    User Administrator
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Akun pengelola dashboard
                                                </p>
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className="font-semibold"
                                            >
                                                {cms_metrics.total_users} Akun
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between rounded-lg border p-3">
                                            <div>
                                                <p className="text-sm font-semibold">
                                                    Bahasa Aktif
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Lokalisasi bahasa konten
                                                </p>
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className="font-semibold"
                                            >
                                                ID & EN
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between rounded-lg border p-3">
                                            <div>
                                                <p className="text-sm font-semibold">
                                                    Integrasi Map & Wilayah
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Wilayah operasional
                                                </p>
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className="border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"
                                            >
                                                Connected
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </div>
                                <CardContent className="pt-0">
                                    <a
                                        href="/my-admin/dashboard/config/main"
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                                    >
                                        <Settings className="h-4 w-4" />
                                        Buka Pengaturan Web
                                    </a>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Articles & Pages Tables */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Card className="rounded-2xl border border-muted/80 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg font-semibold">
                                            Artikel / Blog Terbaru
                                        </CardTitle>
                                        <CardDescription>
                                            Daftar 5 postingan terakhir
                                        </CardDescription>
                                    </div>
                                    <a
                                        href="/my-admin/dashboard/posts"
                                        className="text-xs font-semibold text-primary hover:underline"
                                    >
                                        Lihat Semua
                                    </a>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Judul</TableHead>
                                                <TableHead>Penulis</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">
                                                    Aksi
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recent_posts &&
                                            recent_posts.length > 0 ? (
                                                recent_posts.map((post) => (
                                                    <TableRow key={post.id}>
                                                        <TableCell className="max-w-[200px] truncate font-medium">
                                                            {post.title}
                                                        </TableCell>
                                                        <TableCell className="text-xs">
                                                            {post.author}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                className={
                                                                    post.status ===
                                                                    'publish'
                                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                        : 'border-amber-200 bg-amber-50 text-amber-700'
                                                                }
                                                            >
                                                                {post.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <a
                                                                href={`/my-admin/dashboard/posts/${post.id}/edit`}
                                                                className="text-xs font-semibold text-primary hover:underline"
                                                            >
                                                                Edit
                                                            </a>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={4}
                                                        className="py-4 text-center text-sm text-muted-foreground"
                                                    >
                                                        Belum ada artikel.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border border-muted/80 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg font-semibold">
                                            Halaman Website Terbaru
                                        </CardTitle>
                                        <CardDescription>
                                            Daftar 5 halaman terakhir
                                        </CardDescription>
                                    </div>
                                    <a
                                        href="/my-admin/dashboard/pages"
                                        className="text-xs font-semibold text-primary hover:underline"
                                    >
                                        Lihat Semua
                                    </a>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Judul</TableHead>
                                                <TableHead>Pembuat</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">
                                                    Aksi
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recent_pages &&
                                            recent_pages.length > 0 ? (
                                                recent_pages.map((page) => (
                                                    <TableRow key={page.id}>
                                                        <TableCell className="max-w-[200px] truncate font-medium">
                                                            {page.title}
                                                        </TableCell>
                                                        <TableCell className="text-xs">
                                                            {page.creator}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                className={
                                                                    page.status ===
                                                                    'publish'
                                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                        : 'border-amber-200 bg-amber-50 text-amber-700'
                                                                }
                                                            >
                                                                {page.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <a
                                                                href={`/my-admin/dashboard/pages/${page.id}/edit`}
                                                                className="text-xs font-semibold text-primary hover:underline"
                                                            >
                                                                Edit
                                                            </a>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={4}
                                                        className="py-4 text-center text-sm text-muted-foreground"
                                                    >
                                                        Belum ada halaman.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    /* Existing E-Commerce Tab View */
                    <div className="space-y-6">
                        {/* KPI Cards Grid */}
                        {kpiCards.length > 0 && (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {kpiCards.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <Card
                                            key={item.title}
                                            className="rounded-2xl border shadow-sm"
                                        >
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <CardDescription className="text-xs tracking-wide uppercase">
                                                            {item.title}
                                                        </CardDescription>
                                                        <CardTitle className="mt-2 text-2xl font-semibold">
                                                            {item.value}
                                                        </CardTitle>
                                                    </div>
                                                    <div className="rounded-xl bg-muted p-2.5">
                                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="secondary"
                                                        className={
                                                            item.growth.positive
                                                                ? 'text-emerald-700'
                                                                : 'text-amber-700'
                                                        }
                                                    >
                                                        {item.growth.positive ? (
                                                            <ArrowUpRight className="mr-1 h-3 w-3" />
                                                        ) : (
                                                            <ArrowDownRight className="mr-1 h-3 w-3" />
                                                        )}
                                                        {item.growth.label}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground">
                                                        vs periode lalu
                                                    </p>
                                                </div>
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    {item.description}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        {/* Charts Section */}
                        {(showOrders || showPayments) && (
                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                                {/* Line Chart */}
                                {showOrders && (
                                    <Card className={`rounded-2xl shadow-sm ${showPayments ? 'xl:col-span-8' : 'xl:col-span-12'}`}>
                                        <CardHeader>
                                            <CardTitle>Revenue Growth</CardTitle>
                                            <CardDescription>
                                                Pergerakan omzet pada periode terpilih
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="h-80 w-full">
                                                {charts.revenue_growth &&
                                                charts.revenue_growth.length > 0 ? (
                                                    <ResponsiveContainer
                                                        width="100%"
                                                        height="100%"
                                                    >
                                                        <LineChart
                                                            data={charts.revenue_growth}
                                                        >
                                                            <XAxis
                                                                dataKey="name"
                                                                stroke="#94a3b8"
                                                                fontSize={12}
                                                                tickLine={false}
                                                                axisLine={false}
                                                            />
                                                            <YAxis
                                                                stroke="#94a3b8"
                                                                fontSize={12}
                                                                tickLine={false}
                                                                axisLine={false}
                                                                tickFormatter={(
                                                                    value,
                                                                ) =>
                                                                    `Rp ${(Number(value) / 1_000_000).toFixed(0)}jt`
                                                                }
                                                            />
                                                            <Tooltip
                                                                formatter={(value) =>
                                                                    formatCurrency(
                                                                        Number(value),
                                                                    )
                                                                }
                                                            />
                                                            <Line
                                                                type="monotone"
                                                                dataKey="value"
                                                                stroke="#2563eb"
                                                                strokeWidth={3}
                                                                dot={{
                                                                    r: 4,
                                                                    fill: '#2563eb',
                                                                }}
                                                                activeDot={{ r: 6 }}
                                                            />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <EmptyState text="Tidak ada data penjualan untuk grafik ini." />
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Status Pies */}
                                {(showOrders || showPayments) && (
                                    <div className={`grid grid-cols-1 gap-4 ${showOrders ? 'xl:col-span-4' : 'xl:col-span-12'}`}>
                                        {showOrders && (
                                            <Card className="rounded-2xl shadow-sm">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-md font-semibold">
                                                        Order Status
                                                    </CardTitle>
                                                    <CardDescription>
                                                        Total{' '}
                                                        {formatNumber(totalOrderStatus)}{' '}
                                                        order
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="h-32 w-full">
                                                        {orderStatusData.length > 0 ? (
                                                            <ResponsiveContainer
                                                                width="100%"
                                                                height="100%"
                                                            >
                                                                <PieChart>
                                                                    <Pie
                                                                        data={
                                                                            orderStatusData
                                                                        }
                                                                        dataKey="value"
                                                                        innerRadius={35}
                                                                        outerRadius={55}
                                                                        paddingAngle={2}
                                                                    >
                                                                        {orderStatusData.map(
                                                                            (entry) => (
                                                                                <Cell
                                                                                    key={
                                                                                        entry.name
                                                                                    }
                                                                                    fill={
                                                                                        entry.color
                                                                                    }
                                                                                />
                                                                            ),
                                                                        )}
                                                                    </Pie>
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        ) : (
                                                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                                                Belum ada data
                                                            </div>
                                                        )}
                                                    </div>
                                                    <ChartLegend data={orderStatusData} />
                                                </CardContent>
                                            </Card>
                                        )}

                                        {showPayments && (
                                            <Card className="rounded-2xl shadow-sm">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-md font-semibold">
                                                        Payment Status
                                                    </CardTitle>
                                                    <CardDescription>
                                                        Total{' '}
                                                        {formatNumber(totalPaymentStatus)}{' '}
                                                        transaksi
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="h-32 w-full">
                                                        {paymentStatusData.length > 0 ? (
                                                            <ResponsiveContainer
                                                                width="100%"
                                                                height="100%"
                                                            >
                                                                <PieChart>
                                                                    <Pie
                                                                        data={
                                                                            paymentStatusData
                                                                        }
                                                                        dataKey="value"
                                                                        innerRadius={35}
                                                                        outerRadius={55}
                                                                        paddingAngle={2}
                                                                    >
                                                                        {paymentStatusData.map(
                                                                            (entry) => (
                                                                                <Cell
                                                                                    key={
                                                                                        entry.name
                                                                                    }
                                                                                    fill={
                                                                                        entry.color
                                                                                    }
                                                                                />
                                                                            ),
                                                                        )}
                                                                    </Pie>
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        ) : (
                                                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                                                Belum ada data
                                                            </div>
                                                        )}
                                                    </div>
                                                    <ChartLegend data={paymentStatusData} />
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Store Breakdown & Tables */}
                        {((showProducts && showOrders) || (showBrands && showOrders)) && (
                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                {showProducts && showOrders && (
                                    <Card className="rounded-2xl shadow-sm">
                                        <CardHeader>
                                            <CardTitle>Sales by Category</CardTitle>
                                            <CardDescription>
                                                Kontribusi omzet per kategori
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="h-72 w-full">
                                                {charts.sales_by_category &&
                                                charts.sales_by_category.length > 0 ? (
                                                    <ResponsiveContainer
                                                        width="100%"
                                                        height="100%"
                                                    >
                                                        <BarChart
                                                            data={
                                                                charts.sales_by_category
                                                            }
                                                        >
                                                            <XAxis
                                                                dataKey="name"
                                                                stroke="#94a3b8"
                                                                fontSize={12}
                                                                tickLine={false}
                                                                axisLine={false}
                                                            />
                                                            <YAxis
                                                                stroke="#94a3b8"
                                                                fontSize={12}
                                                                tickLine={false}
                                                                axisLine={false}
                                                                tickFormatter={(
                                                                    value,
                                                                ) =>
                                                                    `${(Number(value) / 1_000_000).toFixed(0)}jt`
                                                                }
                                                            />
                                                            <Tooltip
                                                                formatter={(value) =>
                                                                    formatCurrency(
                                                                        Number(value),
                                                                    )
                                                                }
                                                            />
                                                            <Bar
                                                                dataKey="value"
                                                                radius={[8, 8, 0, 0]}
                                                                fill="#0ea5e9"
                                                            />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <EmptyState text="Tidak ada data penjualan kategori." />
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {showBrands && showOrders && (
                                    <Card className="rounded-2xl shadow-sm">
                                        <CardHeader>
                                            <CardTitle>Sales by Brand</CardTitle>
                                            <CardDescription>
                                                Kontribusi omzet per brand
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="h-72 w-full">
                                                {charts.sales_by_brand &&
                                                charts.sales_by_brand.length > 0 ? (
                                                    <ResponsiveContainer
                                                        width="100%"
                                                        height="100%"
                                                    >
                                                        <BarChart
                                                            data={charts.sales_by_brand}
                                                        >
                                                            <XAxis
                                                                dataKey="name"
                                                                stroke="#94a3b8"
                                                                fontSize={12}
                                                                tickLine={false}
                                                                axisLine={false}
                                                            />
                                                            <YAxis
                                                                stroke="#94a3b8"
                                                                fontSize={12}
                                                                tickLine={false}
                                                                axisLine={false}
                                                                tickFormatter={(
                                                                    value,
                                                                ) =>
                                                                    `${(Number(value) / 1_000_000).toFixed(0)}jt`
                                                                }
                                                            />
                                                            <Tooltip
                                                                formatter={(value) =>
                                                                    formatCurrency(
                                                                        Number(value),
                                                                    )
                                                                }
                                                            />
                                                            <Bar
                                                                dataKey="value"
                                                                radius={[8, 8, 0, 0]}
                                                                fill="#14b8a6"
                                                            />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <EmptyState text="Tidak ada data penjualan brand." />
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {((showProducts && showOrders) || showProducts) && (
                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                {showProducts && showOrders && (
                                    <Card className="rounded-2xl shadow-sm">
                                        <CardHeader>
                                            <CardTitle>Top Selling Products</CardTitle>
                                            <CardDescription>
                                                Produk dengan performa penjualan terbaik
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Product</TableHead>
                                                        <TableHead>SKU</TableHead>
                                                        <TableHead className="text-right">
                                                            Sold
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Revenue
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {tables.top_selling_products &&
                                                    tables.top_selling_products.length >
                                                        0 ? (
                                                        tables.top_selling_products.map(
                                                            (item, index) => (
                                                                <TableRow
                                                                    key={`${item.sku}-${index}`}
                                                                >
                                                                    <TableCell className="font-medium">
                                                                        {item.name}
                                                                    </TableCell>
                                                                    <TableCell className="font-mono text-xs">
                                                                        {item.sku}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        {formatNumber(
                                                                            item.sold,
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        {formatCurrency(
                                                                            item.revenue,
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ),
                                                        )
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell
                                                                colSpan={4}
                                                                className="py-4 text-center text-sm text-muted-foreground"
                                                            >
                                                                Belum ada data penjualan
                                                                pada periode ini.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                )}

                                {showProducts && (
                                    <Card className="rounded-2xl shadow-sm">
                                        <CardHeader>
                                            <CardTitle>Low Stock Products</CardTitle>
                                            <CardDescription>
                                                Produk yang butuh perhatian restock
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Product</TableHead>
                                                        <TableHead>SKU</TableHead>
                                                        <TableHead className="text-right">
                                                            Stock
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Min
                                                        </TableHead>
                                                        <TableHead>Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {tables.low_stock_products &&
                                                    tables.low_stock_products.length >
                                                        0 ? (
                                                        tables.low_stock_products.map(
                                                            (item, index) => (
                                                                <TableRow
                                                                    key={`${item.sku}-${index}`}
                                                                >
                                                                    <TableCell className="font-medium">
                                                                        {item.name}
                                                                    </TableCell>
                                                                    <TableCell className="font-mono text-xs">
                                                                        {item.sku}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        {formatNumber(
                                                                            item.stock,
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        {formatNumber(
                                                                            item.min,
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className={
                                                                                item.status ===
                                                                                'Critical'
                                                                                    ? 'text-rose-700'
                                                                                    : 'text-amber-700'
                                                                            }
                                                                        >
                                                                            {
                                                                                item.status
                                                                            }
                                                                        </Badge>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ),
                                                        )
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell
                                                                colSpan={5}
                                                                className="py-4 text-center text-sm text-muted-foreground"
                                                            >
                                                                Tidak ada produk low
                                                                stock saat ini.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* Stock Summary Chart */}
                        {showStockUnits && (
                            <Card className="rounded-2xl shadow-sm">
                                <CardHeader>
                                    <CardTitle>Stock Unit Summary</CardTitle>
                                    <CardDescription>
                                        Distribusi unit stok berdasarkan status
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-72 w-full">
                                        {charts.stock_unit_summary &&
                                        charts.stock_unit_summary.length > 0 ? (
                                            <ResponsiveContainer
                                                width="100%"
                                                height="100%"
                                            >
                                                <BarChart
                                                    data={charts.stock_unit_summary}
                                                >
                                                    <XAxis
                                                        dataKey="name"
                                                        stroke="#94a3b8"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                    />
                                                    <YAxis
                                                        stroke="#94a3b8"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                    />
                                                    <Tooltip
                                                        formatter={(value) =>
                                                            formatNumber(
                                                                Number(value),
                                                            )
                                                        }
                                                    />
                                                    <Bar
                                                        dataKey="value"
                                                        radius={[10, 10, 0, 0]}
                                                        fill="#6366f1"
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <EmptyState text="Tidak ada data stok." />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Recent Transactions lists */}
                        {(showOrders || showPayments || showStockUnits) && (
                            <div className={`grid grid-cols-1 gap-4 ${
                                [showOrders, showPayments, showStockUnits].filter(Boolean).length === 3
                                    ? 'xl:grid-cols-3'
                                    : [showOrders, showPayments, showStockUnits].filter(Boolean).length === 2
                                    ? 'xl:grid-cols-2'
                                    : 'xl:grid-cols-1'
                            }`}>
                                {showOrders && (
                                    <Card className="rounded-2xl shadow-sm">
                                        <CardHeader>
                                            <CardTitle>Recent Orders</CardTitle>
                                            <CardDescription>
                                                Order terbaru yang masuk
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {tables.recent_orders &&
                                            tables.recent_orders.length > 0 ? (
                                                tables.recent_orders.map((order) => (
                                                    <div
                                                        key={order.id}
                                                        className="rounded-xl border p-3"
                                                    >
                                                        <p className="text-xs text-muted-foreground">
                                                            {order.order_no}
                                                        </p>
                                                        <p className="mt-1 text-sm font-medium">
                                                            {order.customer}
                                                        </p>
                                                        <div className="mt-2 flex items-center justify-between">
                                                            <p className="text-sm font-semibold">
                                                                {formatCurrency(
                                                                    order.total,
                                                                )}
                                                            </p>
                                                            <Badge variant="secondary">
                                                                {order.payment}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <EmptyState text="Belum ada order pada periode ini." />
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {showPayments && (
                                    <Card className="rounded-2xl shadow-sm">
                                        <CardHeader>
                                            <CardTitle>Pending Payments</CardTitle>
                                            <CardDescription>
                                                Pembayaran yang perlu ditindaklanjuti
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {tables.pending_payments &&
                                            tables.pending_payments.length > 0 ? (
                                                tables.pending_payments.map(
                                                    (payment) => (
                                                        <div
                                                            key={payment.id}
                                                            className="rounded-xl border p-3"
                                                        >
                                                            <p className="text-xs text-muted-foreground">
                                                                {payment.order_no}
                                                            </p>
                                                            <p className="mt-1 text-sm font-medium">
                                                                {payment.customer}
                                                            </p>
                                                            <div className="mt-2 flex items-center justify-between gap-2">
                                                                <p className="text-sm font-semibold">
                                                                    {formatCurrency(
                                                                        payment.amount,
                                                                    )}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {payment.method}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ),
                                                )
                                            ) : (
                                                <EmptyState text="Tidak ada pending payment pada periode ini." />
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {showStockUnits && (
                                    <Card className="rounded-2xl shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-rose-600" />
                                                Damaged Stock Units
                                            </CardTitle>
                                            <CardDescription>
                                                Unit rusak yang butuh penanganan
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {tables.damaged_stock_units &&
                                            tables.damaged_stock_units.length > 0 ? (
                                                tables.damaged_stock_units.map(
                                                    (unit) => (
                                                        <div
                                                            key={unit.id}
                                                            className="rounded-xl border p-3"
                                                        >
                                                            <p className="text-sm font-medium">
                                                                {unit.product}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {unit.sku}
                                                            </p>
                                                            <p className="mt-1 font-mono text-xs text-muted-foreground">
                                                                {unit.unit}
                                                            </p>
                                                            <div className="mt-2 flex items-center justify-between">
                                                                <Badge variant="outline">
                                                                    Grade {unit.grade}
                                                                </Badge>
                                                                <span className="text-xs text-muted-foreground">
                                                                    Battery{' '}
                                                                    {unit.battery !==
                                                                    null
                                                                        ? `${unit.battery}%`
                                                                        : '-'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ),
                                                )
                                            ) : (
                                                <EmptyState text="Tidak ada unit rusak saat ini." />
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
