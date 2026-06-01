import { Head, Link, router } from '@inertiajs/react';
import {
    Barcode,
    Boxes,
    CheckCircle2,
    Edit,
    Eye,
    Package,
    Plus,
    ScanBarcode,
    Trash,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { DataTable } from '@/components/DataTable';
import SearchableSelect from '@/components/SearchableSelect';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

import type { LaravelPagination } from '@/types/LaravelPagination';

interface Product {
    id: string;
    name: string;
    sku?: string | null;
}

interface ProductVariant {
    id: string;
    name: string;
    sku: string;
    product?: Product | null;
}

interface ProductStockUnit {
    id: string;
    product_id: string;
    product_variant_id: string | null;
    imei_serial_number: string;
    barcode?: string | null;
    battery_health?: number | null;
    grade?: string | null;
    network_compatibility: string | null;
    status: 'available' | 'reserved' | 'sold' | 'damaged';
    note?: string | null;
    created_at: string;
    variant?: ProductVariant | null;
    product?: Product | null;
}

interface VariantOption {
    id: string;
    name: string;
    sku: string;
}

interface Props {
    stockUnits: LaravelPagination<ProductStockUnit>;
    variants: VariantOption[];
    summary: {
        products: number;
        product_variants: number;
        stock_units: number;
        available_stock_units: number;
        non_available_stock_units: number;
    };
    filters: {
        search?: string;
        status?: string;
        product_variant_id?: string;
    };
}

const networkLabel = (network?: string | null) =>
    network
        ? ({
              sim_free: 'All Operator',
              docomo: 'Docomo',
              au: 'AU',
              softbank: 'SoftBank',
              rakuten: 'Rakuten',
              mineo: 'Mineo',
          }[network] ?? network)
        : '-';

const statusClass = (status: ProductStockUnit['status']) =>
    ({
        available:
            'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
        reserved:
            'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
        sold: 'border-border bg-muted/50 text-foreground',
        damaged:
            'border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300',
    })[status];

function SummaryCard({
    title,
    value,
    icon: Icon,
}: {
    title: string;
    value: number;
    icon: React.ElementType;
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    {title}
                </span>
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <p className="mt-4 text-3xl font-extrabold tracking-tight text-foreground">
                {value.toLocaleString('id-ID')}
            </p>
        </div>
    );
}

export default function Index({
    stockUnits,
    variants,
    summary,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [variantId, setVariantId] = useState(filters.product_variant_id || '');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const currentPageIds = useMemo(
        () => stockUnits.data.map((item) => item.id),
        [stockUnits.data],
    );

    const allCurrentSelected =
        currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));

    const applyFilter = () => {
        router.get(
            '/dashboard/ecommerce/product-stock-units',
            {
                search,
                status,
                product_variant_id: variantId,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearFilter = () => {
        setSearch('');
        setStatus('');
        setVariantId('');
        setSelectedIds([]);

        router.get('/dashboard/ecommerce/product-stock-units', {}, { replace: true });
    };

    const toggleSelect = (id: string, checked: boolean) => {
        setSelectedIds((prev) => {
            if (checked) {
                return prev.includes(id) ? prev : [...prev, id];
            }

            return prev.filter((item) => item !== id);
        });
    };

    const toggleSelectAllCurrent = (checked: boolean) => {
        setSelectedIds((prev) => {
            if (checked) {
                return Array.from(new Set([...prev, ...currentPageIds]));
            }

            return prev.filter((id) => !currentPageIds.includes(id));
        });
    };

    const handleBulkGenerate = () => {
        if (selectedIds.length === 0) {
            return;
        }

        router.post(
            '/dashboard/ecommerce/product-stock-units/bulk-generate-barcode',
            { stock_unit_ids: selectedIds },
            { preserveScroll: true },
        );
    };

    const handlePrintSelected = () => {
        if (selectedIds.length === 0) {
            return;
        }

        router.post(
            '/dashboard/ecommerce/product-stock-units/barcodes/print-selected',
            { stock_unit_ids: selectedIds },
            { preserveScroll: true },
        );
    };

    const handlePrintAllFiltered = () => {
        router.get('/dashboard/ecommerce/product-stock-units/barcodes/print', {
            search,
            status,
            product_variant_id: variantId,
        });
    };

    const handleDelete = () => {
        if (!deletingId) {
            return;
        }

        router.delete(`/dashboard/ecommerce/product-stock-units/${deletingId}`, {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    };

    const columns = [
        {
            label: 'Select',
            render: (row: ProductStockUnit) => (
                <Checkbox
                    checked={selectedIds.includes(row.id)}
                    onCheckedChange={(checked) => toggleSelect(row.id, checked === true)}
                />
            ),
        },
        {
            label: 'IMEI / Serial',
            render: (row: ProductStockUnit) => (
                <div className="flex flex-col">
                    <span className="font-mono text-sm font-semibold">{row.imei_serial_number}</span>
                    <span className="text-xs text-muted-foreground">
                        Network: {networkLabel(row.network_compatibility)}
                    </span>
                </div>
            ),
        },
        {
            label: 'Barcode',
            render: (row: ProductStockUnit) =>
                row.barcode ? (
                    <span className="font-mono text-xs">{row.barcode}</span>
                ) : (
                    <Badge variant="secondary" className="text-amber-700">
                        Belum ada barcode
                    </Badge>
                ),
        },
        // {
        //     label: 'Battery Health',
        //     render: (row: ProductStockUnit) => (
        //         <span className="text-sm">
        //             {typeof row.battery_health === 'number' ? `${row.battery_health}%` : '-'}
        //         </span>
        //     ),
        // },
        // {
        //     label: 'Grade',
        //     render: (row: ProductStockUnit) => (
        //         <span className="text-sm font-medium">{row.grade || '-'}</span>
        //     ),
        // },
        {
            label: 'Product',
            render: (row: ProductStockUnit) => (
                <span className="text-sm font-medium">{row.product?.name || row.variant?.product?.name || '-'}</span>
            ),
        },
        {
            label: 'Product Variant',
            render: (row: ProductStockUnit) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{row.variant?.name || row.product?.name || '-'}</span>
                    <span className="text-xs text-muted-foreground">
                        SKU: {row.variant?.sku || row.product?.sku || '-'}
                    </span>
                </div>
            ),
        },
        {
            label: 'Status',
            render: (row: ProductStockUnit) => (
                <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold uppercase ${statusClass(row.status)}`}>
                    {row.status}
                </span>
            ),
        },
        {
            label: 'Actions',
            render: (row: ProductStockUnit) => (
                <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/ecommerce/product-stock-units/${row.id}`}>
                        <Button size="sm" variant="secondary" title="Detail">
                            <Eye className="h-3.5 w-3.5" />
                        </Button>
                    </Link>

                    <Link href={`/dashboard/ecommerce/product-stock-units/${row.id}/edit`}>
                        <Button size="sm" variant="secondary" title="Edit">
                            <Edit className="h-3.5 w-3.5" />
                        </Button>
                    </Link>

                    {!row.barcode && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() =>
                                router.post(`/dashboard/ecommerce/product-stock-units/${row.id}/generate-barcode`, {}, { preserveScroll: true })
                            }
                        >
                            <Barcode className="h-3.5 w-3.5" />
                            Generate
                        </Button>
                    )}

                    {row.barcode && (
                        <>
                            <Link href={`/dashboard/ecommerce/product-stock-units/barcodes/print?ids=${row.id}`}>
                                <Button size="sm" variant="outline">
                                    Print
                                </Button>
                            </Link>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const confirmed = window.confirm('Regenerate barcode unit ini?');

                                    if (!confirmed) {
                                        return;
                                    }

                                    router.post(
                                        `/dashboard/ecommerce/product-stock-units/${row.id}/regenerate-barcode`,
                                        {},
                                        { preserveScroll: true },
                                    );
                                }}
                                disabled={row.status === 'sold'}
                            >
                                Regenerate
                            </Button>
                        </>
                    )}

                    <Button
                        size="sm"
                        variant="destructive"
                        title="Delete"
                        onClick={() => setDeletingId(row.id)}
                    >
                        <Trash className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Stok Unit" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Stok Unit</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Daftar IMEI/serial unit beserta product dan product variant yang terhubung.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link href="/dashboard/ecommerce/barcode-scanner">
                            <Button variant="outline" className="gap-2">
                                <ScanBarcode className="h-4 w-4" />
                                Barcode Scanner
                            </Button>
                        </Link>
                        <Link href="/dashboard/ecommerce/product-stock-units/create">
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Stok Unit
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-5">
                    <SummaryCard title="Product" value={summary.products} icon={Package} />
                    <SummaryCard title="Product Variant" value={summary.product_variants} icon={Boxes} />
                    <SummaryCard title="Stok Unit" value={summary.stock_units} icon={ScanBarcode} />
                    <SummaryCard title="Available" value={summary.available_stock_units} icon={CheckCircle2} />
                    <SummaryCard title="Non Available" value={summary.non_available_stock_units} icon={XCircle} />
                </div>

                <div className="flex flex-wrap gap-3">
                    <div>
                        <Input
                            className="max-w-xs"
                            placeholder="Search IMEI, barcode, product, grade..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                        />
                    </div>

                    <div>
                        <select
                            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="available">Available</option>
                            <option value="reserved">Reserved</option>
                            <option value="sold">Sold</option>
                            <option value="damaged">Damaged</option>
                        </select>
                    </div>

                    <div>
                        <SearchableSelect
                            className="min-w-72"
                            options={variants.map((variant) => ({
                                value: variant.id,
                                label: variant.name,
                                description: variant.sku,
                            }))}
                            value={variantId}
                            onChange={(value) => setVariantId(value ?? '')}
                            placeholder="All Product Variants"
                            clearable
                        />
                    </div>

                    <Button onClick={applyFilter}>Apply Filter</Button>
                    <Button variant="outline" onClick={clearFilter}>
                        Clear
                    </Button>
                </div>

                <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="mr-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                            <Checkbox
                                checked={allCurrentSelected}
                                onCheckedChange={(checked) => toggleSelectAllCurrent(checked === true)}
                            />
                            Select all di halaman ini
                        </label>

                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={handleBulkGenerate}
                            disabled={selectedIds.length === 0}
                        >
                            <Barcode className="h-4 w-4" />
                            Generate Barcode
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handlePrintSelected}
                            disabled={selectedIds.length === 0}
                        >
                            Print Selected Barcode
                        </Button>

                        <Button variant="outline" onClick={handlePrintAllFiltered}>
                            Print All Filtered
                        </Button>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">{selectedIds.length} item terpilih.</p>
                </div>

                <DataTable<ProductStockUnit> data={stockUnits.data} columns={columns} />

                <div className="flex flex-wrap gap-2">
                    {stockUnits.links.map((link, i) => (
                        <button
                            key={i}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            disabled={!link.url}
                            onClick={() => link.url && router.visit(link.url)}
                            className={`rounded px-3 py-1 text-sm ${
                                link.active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                            } ${!link.url && 'opacity-50'}`}
                        />
                    ))}
                </div>
            </div>

            <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete stok unit?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will delete the selected IMEI/serial stock unit and resync its variant stock.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
