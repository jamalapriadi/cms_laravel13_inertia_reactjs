import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Boxes,
    CreditCard,
    DollarSign,
    ShoppingCart,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface Metrics {
    total_revenue: number;
    total_orders: number;
    available_stock_units: number;
    pending_payments: number;
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

const piePalette = ['#16a34a', '#2563eb', '#f59e0b', '#dc2626', '#14b8a6', '#7c3aed'];

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
                <div key={item.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                    <span className="font-medium text-foreground">{formatNumber(item.value)}</span>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">{text}</p>;
}

export default function Dashboard({ filters, metrics, charts, tables }: Props) {
    const [dateRange, setDateRange] = useState(filters.date_range || 'last_30_days');

    const orderStatusData = useMemo(
        () => charts.order_status.map((item, index) => ({ ...item, color: piePalette[index % piePalette.length] })),
        [charts.order_status],
    );

    const paymentStatusData = useMemo(
        () => charts.payment_status.map((item, index) => ({ ...item, color: piePalette[index % piePalette.length] })),
        [charts.payment_status],
    );

    const totalOrderStatus = useMemo(
        () => charts.order_status.reduce((acc, item) => acc + item.value, 0),
        [charts.order_status],
    );

    const totalPaymentStatus = useMemo(
        () => charts.payment_status.reduce((acc, item) => acc + item.value, 0),
        [charts.payment_status],
    );

    const kpiCards = [
        {
            title: 'Total Revenue',
            value: formatCurrency(metrics.total_revenue),
            growth: formatGrowth(metrics.growth.total_revenue),
            description: `Periode ${filters.label}`,
            icon: DollarSign,
        },
        {
            title: 'Total Orders',
            value: formatNumber(metrics.total_orders),
            growth: formatGrowth(metrics.growth.total_orders),
            description: `Order masuk pada ${filters.label}`,
            icon: ShoppingCart,
        },
        {
            title: 'Available Stock Unit',
            value: formatNumber(metrics.available_stock_units),
            growth: formatGrowth(metrics.growth.available_stock_units),
            description: 'Snapshot unit siap jual saat ini',
            icon: Boxes,
        },
        {
            title: 'Pending Payments',
            value: formatNumber(metrics.pending_payments),
            growth: formatGrowth(metrics.growth.pending_payments),
            description: `Menunggu pembayaran pada ${filters.label}`,
            icon: CreditCard,
        },
    ];

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
            <Head title="Executive Dashboard" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">Executive Dashboard</h1>
                            <p className="mt-1 text-sm text-muted-foreground">Ringkasan performa bisnis</p>
                            <p className="mt-1 text-xs text-muted-foreground">{filters.label}</p>
                        </div>

                        <div className="w-full md:w-64">
                            <p className="mb-2 text-xs font-medium text-muted-foreground">Date Range</p>
                            <Select value={dateRange} onValueChange={handleDateRangeChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih rentang tanggal" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dateRangeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {kpiCards.map((item) => {
                        const Icon = item.icon;

                        return (
                            <Card key={item.title} className="rounded-2xl border shadow-sm">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <CardDescription className="text-xs uppercase tracking-wide">{item.title}</CardDescription>
                                            <CardTitle className="mt-2 text-2xl font-semibold">{item.value}</CardTitle>
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
                                            className={item.growth.positive ? 'text-emerald-700' : 'text-amber-700'}
                                        >
                                            {item.growth.positive ? (
                                                <ArrowUpRight className="mr-1 h-3 w-3" />
                                            ) : (
                                                <ArrowDownRight className="mr-1 h-3 w-3" />
                                            )}
                                            {item.growth.label}
                                        </Badge>
                                        <p className="text-xs text-muted-foreground">vs periode lalu</p>
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                    <Card className="rounded-2xl shadow-sm xl:col-span-8">
                        <CardHeader>
                            <CardTitle>Revenue Growth</CardTitle>
                            <CardDescription>Pergerakan omzet pada periode terpilih</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={charts.revenue_growth}>
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis
                                            stroke="#94a3b8"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `Rp ${(Number(value) / 1_000_000).toFixed(0)}jt`}
                                        />
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#2563eb"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#2563eb' }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 gap-4 xl:col-span-4">
                        <Card className="rounded-2xl shadow-sm">
                            <CardHeader>
                                <CardTitle>Order Status</CardTitle>
                                <CardDescription>Total {formatNumber(totalOrderStatus)} order</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-44 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={orderStatusData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={2}>
                                                {orderStatusData.map((entry) => (
                                                    <Cell key={entry.name} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <ChartLegend data={orderStatusData} />
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl shadow-sm">
                            <CardHeader>
                                <CardTitle>Payment Status</CardTitle>
                                <CardDescription>Total {formatNumber(totalPaymentStatus)} transaksi</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-44 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={paymentStatusData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={2}>
                                                {paymentStatusData.map((entry) => (
                                                    <Cell key={entry.name} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <ChartLegend data={paymentStatusData} />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle>Sales by Category</CardTitle>
                            <CardDescription>Kontribusi omzet per kategori</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={charts.sales_by_category}>
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis
                                            stroke="#94a3b8"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${(Number(value) / 1_000_000).toFixed(0)}jt`}
                                        />
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#0ea5e9" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle>Sales by Brand</CardTitle>
                            <CardDescription>Kontribusi omzet per brand</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={charts.sales_by_brand}>
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis
                                            stroke="#94a3b8"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${(Number(value) / 1_000_000).toFixed(0)}jt`}
                                        />
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#14b8a6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle>Top Selling Products</CardTitle>
                            <CardDescription>Produk dengan performa penjualan terbaik</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead className="text-right">Sold</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tables.top_selling_products.length > 0 ? (
                                        tables.top_selling_products.map((item, index) => (
                                            <TableRow key={`${item.sku}-${index}`}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                                                <TableCell className="text-right">{formatNumber(item.sold)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                                                Belum ada data penjualan pada periode ini.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle>Low Stock Products</CardTitle>
                            <CardDescription>Produk yang butuh perhatian restock</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead className="text-right">Stock</TableHead>
                                        <TableHead className="text-right">Min</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tables.low_stock_products.length > 0 ? (
                                        tables.low_stock_products.map((item, index) => (
                                            <TableRow key={`${item.sku}-${index}`}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                                                <TableCell className="text-right">{formatNumber(item.stock)}</TableCell>
                                                <TableCell className="text-right">{formatNumber(item.min)}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className={item.status === 'Critical' ? 'text-rose-700' : 'text-amber-700'}
                                                    >
                                                        {item.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                                                Tidak ada produk low stock saat ini.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle>Stock Unit Summary</CardTitle>
                        <CardDescription>Distribusi unit stok berdasarkan status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.stock_unit_summary}>
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip formatter={(value) => formatNumber(Number(value))} />
                                    <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#6366f1" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle>Recent Orders</CardTitle>
                            <CardDescription>Order terbaru yang masuk</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {tables.recent_orders.length > 0 ? (
                                tables.recent_orders.map((order) => (
                                    <div key={order.id} className="rounded-xl border p-3">
                                        <p className="text-xs text-muted-foreground">{order.order_no}</p>
                                        <p className="mt-1 text-sm font-medium">{order.customer}</p>
                                        <div className="mt-2 flex items-center justify-between">
                                            <p className="text-sm font-semibold">{formatCurrency(order.total)}</p>
                                            <Badge variant="secondary">{order.payment}</Badge>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState text="Belum ada order pada periode ini." />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle>Pending Payments</CardTitle>
                            <CardDescription>Pembayaran yang perlu ditindaklanjuti</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {tables.pending_payments.length > 0 ? (
                                tables.pending_payments.map((payment) => (
                                    <div key={payment.id} className="rounded-xl border p-3">
                                        <p className="text-xs text-muted-foreground">{payment.order_no}</p>
                                        <p className="mt-1 text-sm font-medium">{payment.customer}</p>
                                        <div className="mt-2 flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold">{formatCurrency(payment.amount)}</p>
                                            <p className="text-xs text-muted-foreground">{payment.method}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState text="Tidak ada pending payment pada periode ini." />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-rose-600" />
                                Damaged Stock Units
                            </CardTitle>
                            <CardDescription>Unit rusak yang butuh penanganan</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {tables.damaged_stock_units.length > 0 ? (
                                tables.damaged_stock_units.map((unit) => (
                                    <div key={unit.id} className="rounded-xl border p-3">
                                        <p className="text-sm font-medium">{unit.product}</p>
                                        <p className="text-xs text-muted-foreground">{unit.sku}</p>
                                        <p className="mt-1 font-mono text-xs text-muted-foreground">{unit.unit}</p>
                                        <div className="mt-2 flex items-center justify-between">
                                            <Badge variant="outline">Grade {unit.grade}</Badge>
                                            <span className="text-xs text-muted-foreground">
                                                Battery {unit.battery !== null ? `${unit.battery}%` : '-'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState text="Tidak ada unit rusak saat ini." />
                            )}
                        </CardContent>
                    </Card>
                </div>
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
