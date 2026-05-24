import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

import { DataTable } from '@/components/DataTable';

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

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import AppLayout from '@/layouts/master-data-layout';

import type { LaravelPagination } from '@/types/LaravelPagination';

/**
 * TYPE
 */
interface Product {
    id: string;
    name: string;
}

type NetworkCompatibility =
    | 'sim_free'
    | 'docomo'
    | 'au'
    | 'softbank'
    | 'rakuten'
    | 'mineo';

interface ProductStockUnit {
    id: string;
    product_variant_id: string;
    imei_serial_number: string;
    network_compatibility: NetworkCompatibility | null;
    status: 'available' | 'reserved' | 'sold' | 'damaged';
    note?: string | null;
}

interface ProductVariant {
    id: string;
    product_id: string;
    name: string;
    color?: string | null;
    storage?: string | null;
    sku: string;
    image?: string | null;
    price: string | number;
    cost_price?: string | number | null;
    stock: number;
    stock_units_count?: number;
    available_stock_units_count?: number;
    stock_units?: ProductStockUnit[];
    is_active: boolean;
    product?: Product;
}

interface Props {
    variants: LaravelPagination<ProductVariant>;
    products: Product[];

    filters: {
        search?: string;
        product_id?: string;
    };
}

const networkOptions: { value: NetworkCompatibility; label: string }[] = [
    { value: 'sim_free', label: 'All Operator' },
    { value: 'docomo', label: 'Docomo' },
    { value: 'au', label: 'AU' },
    { value: 'softbank', label: 'SoftBank' },
    { value: 'rakuten', label: 'Rakuten' },
    { value: 'mineo', label: 'Mineo' },
];

const networkLabel = (network?: NetworkCompatibility | null) =>
    network
        ? (networkOptions.find((option) => option.value === network)?.label ??
          network)
        : '-';

export default function Index({ variants, products, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [productId, setProductId] = useState(filters.product_id || '');
    const [selectedVariant, setSelectedVariant] =
        useState<ProductVariant | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    /**
     * FILTER
     */
    const applyFilter = () => {
        router.get(
            '/dashboard/ecommerce/product-variants',
            {
                search,
                product_id: productId,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const openStockListModal = (variant: ProductVariant) => {
        setSelectedVariant(variant);
    };

    const openDeleteDialog = (id: string) => {
        setDeletingId(id);
    };

    const handleDelete = () => {
        if (!deletingId) {
            return;
        }

        router.delete(`/dashboard/ecommerce/product-variants/${deletingId}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeletingId(null);
            },
        });
    };

    const availableStockUnits =
        selectedVariant?.stock_units?.filter(
            (stockUnit) => stockUnit.status === 'available',
        ) ?? [];

    /**
     * TABLE COLUMNS
     */
    const columns = [
        {
            label: 'Product',
            render: (row: ProductVariant) => (
                <span className="text-sm font-medium">
                    {row.product?.name || '-'}
                </span>
            ),
        },
        {
            label: 'Warna',
            render: (row: ProductVariant) => (
                <span className="text-sm">{row.color || '-'}</span>
            ),
        },
        {
            label: 'Storage',
            render: (row: ProductVariant) => (
                <span className="text-sm">{row.storage || '-'}</span>
            ),
        },
        {
            label: 'Photo',
            render: (row: ProductVariant) =>
                row.image ? (
                    <img
                        src={`/storage/${row.image}`}
                        alt={row.name}
                        className="h-10 w-10 rounded-md border object-cover"
                    />
                ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                ),
        },
        {
            label: 'Kode / SKU',
            render: (row: ProductVariant) => (
                <span className="text-sm font-medium">{row.sku}</span>
            ),
        },
        {
            label: 'Harga Beli',
            render: (row: ProductVariant) => (
                <span className="text-sm">
                    {row.cost_price != null
                        ? `¥${Number(row.cost_price).toLocaleString('ja-JP')}`
                        : '-'}
                </span>
            ),
        },
        {
            label: 'Harga Jual',
            render: (row: ProductVariant) => (
                <span className="text-sm font-medium">
                    ¥{Number(row.price).toLocaleString('ja-JP')}
                </span>
            ),
        },
        {
            label: 'Stock',
            render: (row: ProductVariant) => {
                const availableStock =
                    row.available_stock_units_count ?? row.stock;

                return (
                    <button
                        type="button"
                        onClick={() => openStockListModal(row)}
                        className={`text-left text-sm font-semibold hover:underline ${
                            availableStock <= 0
                                ? 'text-red-500'
                                : 'text-green-600'
                        }`}
                    >
                        {availableStock} IMEI tersedia
                    </button>
                );
            },
        },
        {
            label: 'Status',
            render: (row: ProductVariant) => (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                    }`}
                >
                    {row.is_active ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            label: 'Action',
            render: (row: ProductVariant) => (
                <div className="flex gap-2">
                    <Link
                        href={`/dashboard/ecommerce/product-variants/${row.id}/edit`}
                    >
                        <Button size="sm" variant="secondary">
                            Edit
                        </Button>
                    </Link>

                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDeleteDialog(row.id)}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Product Variants" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Product Variants</h1>

                        <p className="text-muted-foreground">
                            List of registered product variants
                        </p>
                    </div>

                    <Link href="/dashboard/ecommerce/product-variants/create">
                        <Button>Add Variant</Button>
                    </Link>
                </div>

                <hr />

                {/* FILTER */}
                <div className="flex flex-wrap gap-3">
                    <Input
                        className="max-w-xs"
                        placeholder="Search variant or SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                    />

                    <select
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                    >
                        <option value="">All Products</option>
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.name}
                            </option>
                        ))}
                    </select>

                    <Button onClick={applyFilter}>Apply Filter</Button>
                </div>

                {/* TABLE */}
                <DataTable<ProductVariant>
                    data={variants.data}
                    columns={columns}
                />

                {/* PAGINATION */}
                <div className="flex flex-wrap gap-2">
                    {variants.links.map((link, i) => (
                        <button
                            key={i}
                            dangerouslySetInnerHTML={{
                                __html: link.label,
                            }}
                            disabled={!link.url}
                            onClick={() => link.url && router.visit(link.url)}
                            className={`rounded px-3 py-1 text-sm ${
                                link.active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                            } ${!link.url && 'opacity-50'}`}
                        />
                    ))}
                </div>
            </div>

            {/* STOCK UNIT LIST DIALOG */}
            <Dialog
                open={!!selectedVariant}
                onOpenChange={(open) => !open && setSelectedVariant(null)}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Daftar IMEI Tersedia</DialogTitle>
                        <DialogDescription>
                            {selectedVariant?.product?.name
                                ? `${selectedVariant.product.name} - `
                                : ''}
                            {selectedVariant?.name} ({selectedVariant?.sku})
                        </DialogDescription>
                    </DialogHeader>

                    {availableStockUnits.length > 0 ? (
                        <div className="max-h-[60vh] overflow-y-auto rounded-md border">
                            <div className="grid grid-cols-[1fr_140px_1fr] gap-3 border-b bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground">
                                <span>IMEI / Serial</span>
                                <span>Network</span>
                                <span>Note</span>
                            </div>
                            {availableStockUnits.map((stockUnit) => (
                                <div
                                    key={stockUnit.id}
                                    className="grid grid-cols-[1fr_140px_1fr] gap-3 border-b px-4 py-3 text-sm last:border-b-0"
                                >
                                    <span className="font-mono font-medium break-all">
                                        {stockUnit.imei_serial_number}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {networkLabel(
                                            stockUnit.network_compatibility,
                                        )}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {stockUnit.note || '-'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                            Belum ada IMEI tersedia untuk variant ini.
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* DELETE DIALOG */}
            <AlertDialog
                open={!!deletingId}
                onOpenChange={() => {
                    setDeletingId(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Variant?</AlertDialogTitle>

                        <AlertDialogDescription>
                            This action cannot be undone. The selected product
                            variant will be deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>

                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
