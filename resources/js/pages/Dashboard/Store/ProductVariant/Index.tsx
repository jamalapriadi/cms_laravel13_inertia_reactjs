import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';

import AppLayout from '@/layouts/master-data-layout';
import { zodResolver } from '@hookform/resolvers/zod';

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
    sku: string;
    image?: string | null;
    price: string | number;
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

const stockUnitSchema = z.object({
    product_variant_id: z.string().min(1, 'Product variant is required'),
    imei_serial_number: z
        .string()
        .min(1, 'IMEI / Serial Number is required')
        .max(255),
    network_compatibility: z
        .enum(['sim_free', 'docomo', 'au', 'softbank', 'rakuten', 'mineo'])
        .nullable()
        .optional(),
    status: z
        .enum(['available', 'reserved', 'sold', 'damaged'])
        .default('available'),
    note: z.string().nullable().optional(),
});

type StockUnitFormData = z.infer<typeof stockUnitSchema>;

const networkOptions: { value: NetworkCompatibility; label: string }[] = [
    { value: 'sim_free', label: 'SIM Free' },
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

    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [editingStockUnit, setEditingStockUnit] =
        useState<ProductStockUnit | null>(null);
    const [stockUnitHasNetwork, setStockUnitHasNetwork] = useState(false);
    const [submittingStock, setSubmittingStock] = useState(false);

    const [deletingType, setDeletingType] = useState<
        'variant' | 'stockUnit' | null
    >(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const stockUnitForm = useForm<
        z.input<typeof stockUnitSchema>,
        unknown,
        StockUnitFormData
    >({
        resolver: zodResolver(stockUnitSchema),
        defaultValues: {
            product_variant_id: '',
            imei_serial_number: '',
            network_compatibility: null,
            status: 'available',
            note: '',
        },
    });

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

    /**
     * DELETE
     */
    const openCreateStockModal = (variant: ProductVariant) => {
        setEditingStockUnit(null);
        stockUnitForm.reset({
            product_variant_id: variant.id,
            imei_serial_number: '',
            network_compatibility: null,
            status: 'available',
            note: '',
        });
        setStockUnitHasNetwork(false);
        setIsStockModalOpen(true);
    };

    const openEditStockModal = (stockUnit: ProductStockUnit) => {
        setEditingStockUnit(stockUnit);
        stockUnitForm.reset({
            product_variant_id: stockUnit.product_variant_id,
            imei_serial_number: stockUnit.imei_serial_number,
            network_compatibility: stockUnit.network_compatibility,
            status: stockUnit.status,
            note: stockUnit.note ?? '',
        });
        setStockUnitHasNetwork(!!stockUnit.network_compatibility);
        setIsStockModalOpen(true);
    };

    const handleStockSubmit = (data: StockUnitFormData) => {
        const payload = {
            ...data,
            network_compatibility: stockUnitHasNetwork
                ? data.network_compatibility || 'sim_free'
                : null,
        };

        if (editingStockUnit) {
            router.put(
                `/dashboard/ecommerce/product-stock-units/${editingStockUnit.id}`,
                payload,
                {
                    preserveScroll: true,
                    onStart: () => {
                        setSubmittingStock(true);
                        toast.loading('Updating stock unit...', {
                            id: 'stock-unit',
                        });
                    },
                    onSuccess: () => {
                        toast.success('Stock unit updated successfully!', {
                            id: 'stock-unit',
                        });
                        setIsStockModalOpen(false);
                        setEditingStockUnit(null);
                    },
                    onError: () => {
                        toast.error(
                            'Failed to update stock unit. Check IMEI uniqueness.',
                            { id: 'stock-unit' },
                        );
                    },
                    onFinish: () => setSubmittingStock(false),
                },
            );

            return;
        }

        router.post('/dashboard/ecommerce/product-stock-units', payload, {
            preserveScroll: true,
            onStart: () => {
                setSubmittingStock(true);
                toast.loading('Adding stock unit...', { id: 'stock-unit' });
            },
            onSuccess: () => {
                toast.success('Stock unit added successfully!', {
                    id: 'stock-unit',
                });
                setIsStockModalOpen(false);
            },
            onError: () => {
                toast.error(
                    'Failed to add stock unit. Check IMEI uniqueness.',
                    { id: 'stock-unit' },
                );
            },
            onFinish: () => setSubmittingStock(false),
        });
    };

    const openDeleteDialog = (type: 'variant' | 'stockUnit', id: string) => {
        setDeletingType(type);
        setDeletingId(id);
    };

    const handleDelete = () => {
        if (!deletingId || !deletingType) {
            return;
        }

        const url =
            deletingType === 'variant'
                ? `/dashboard/ecommerce/product-variants/${deletingId}`
                : `/dashboard/ecommerce/product-stock-units/${deletingId}`;

        router.delete(url, {
            preserveScroll: true,
            onFinish: () => {
                setDeletingId(null);
                setDeletingType(null);
            },
        });
    };

    /**
     * TABLE COLUMNS
     */
    const columns = [
        {
            label: 'Name',
            render: (row: ProductVariant) => (
                <div className="flex items-center gap-3">
                    {row.image ? (
                        <img
                            src={`/storage/${row.image}`}
                            alt={row.name}
                            className="h-10 w-10 rounded-md border object-cover"
                        />
                    ) : null}
                    <div className="flex flex-col">
                        <span className="font-medium">{row.name}</span>
                        <span className="text-xs text-muted-foreground">
                            SKU: {row.sku}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            label: 'Product',
            render: (row: ProductVariant) => (
                <span className="text-sm">{row.product?.name || '-'}</span>
            ),
        },
        {
            label: 'Price',
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
                    <div className="space-y-2">
                        <div className="flex flex-col">
                            <span
                                className={`text-sm font-bold ${availableStock <= 0 ? 'text-red-500' : 'text-green-600'}`}
                            >
                                {availableStock}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {row.stock_units_count ?? 0} IMEI units
                            </span>
                        </div>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openCreateStockModal(row)}
                        >
                            Add Stock
                        </Button>

                        {row.stock_units && row.stock_units.length > 0 ? (
                            <div className="space-y-1">
                                {row.stock_units
                                    .slice(0, 3)
                                    .map((stockUnit) => (
                                        <div
                                            key={stockUnit.id}
                                            className="rounded-md border bg-muted/50 px-2 py-1 text-xs"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="truncate font-mono font-semibold">
                                                        {
                                                            stockUnit.imei_serial_number
                                                        }
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                        {networkLabel(
                                                            stockUnit.network_compatibility,
                                                        )}{' '}
                                                        · {stockUnit.status}
                                                    </div>
                                                </div>
                                                <div className="flex shrink-0 gap-1">
                                                    <button
                                                        type="button"
                                                        className="text-primary hover:underline"
                                                        onClick={() =>
                                                            openEditStockModal(
                                                                stockUnit,
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="text-destructive hover:underline"
                                                        onClick={() =>
                                                            openDeleteDialog(
                                                                'stockUnit',
                                                                stockUnit.id,
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                {row.stock_units.length > 3 && (
                                    <p className="text-xs text-muted-foreground">
                                        +{row.stock_units.length - 3} more units
                                    </p>
                                )}
                            </div>
                        ) : null}
                    </div>
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
                        onClick={() => openDeleteDialog('variant', row.id)}
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

            {/* STOCK UNIT DIALOG */}
            <Dialog open={isStockModalOpen} onOpenChange={setIsStockModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingStockUnit
                                ? 'Edit Stock Unit / IMEI'
                                : 'Add Stock Unit / IMEI'}
                        </DialogTitle>
                        <DialogDescription>
                            Input IMEI/serial number and assign network for this
                            selected product variant.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={stockUnitForm.handleSubmit(handleStockSubmit)}
                        className="space-y-5 py-2"
                    >
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="product_variant_id">
                                Product Variant
                            </Label>
                            <select
                                id="product_variant_id"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={stockUnitForm.watch(
                                    'product_variant_id',
                                )}
                                onChange={(e) =>
                                    stockUnitForm.setValue(
                                        'product_variant_id',
                                        e.target.value,
                                        { shouldValidate: true },
                                    )
                                }
                            >
                                <option value="">-- Select Variant --</option>
                                {variants.data.map((variant) => (
                                    <option key={variant.id} value={variant.id}>
                                        {variant.product?.name
                                            ? `${variant.product.name} - `
                                            : ''}
                                        {variant.name} ({variant.sku})
                                    </option>
                                ))}
                            </select>
                            {stockUnitForm.formState.errors
                                .product_variant_id && (
                                <p className="text-xs text-destructive">
                                    {
                                        stockUnitForm.formState.errors
                                            .product_variant_id.message
                                    }
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="imei_serial_number">
                                    IMEI / Serial Number
                                </Label>
                                <Input
                                    id="imei_serial_number"
                                    placeholder="e.g., 351234567890123"
                                    {...stockUnitForm.register(
                                        'imei_serial_number',
                                    )}
                                />
                                {stockUnitForm.formState.errors
                                    .imei_serial_number && (
                                    <p className="text-xs text-destructive">
                                        {
                                            stockUnitForm.formState.errors
                                                .imei_serial_number.message
                                        }
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={stockUnitForm.watch('status')}
                                    onChange={(e) =>
                                        stockUnitForm.setValue(
                                            'status',
                                            e.target
                                                .value as StockUnitFormData['status'],
                                            { shouldValidate: true },
                                        )
                                    }
                                >
                                    <option value="available">Available</option>
                                    <option value="reserved">Reserved</option>
                                    <option value="sold">Sold</option>
                                    <option value="damaged">Damaged</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <Checkbox
                                    checked={stockUnitHasNetwork}
                                    onCheckedChange={(checked) => {
                                        const enabled = checked === true;

                                        setStockUnitHasNetwork(enabled);
                                        stockUnitForm.setValue(
                                            'network_compatibility',
                                            enabled
                                                ? stockUnitForm.watch(
                                                      'network_compatibility',
                                                  ) || 'sim_free'
                                                : null,
                                            { shouldValidate: true },
                                        );
                                    }}
                                />
                                Ada network
                            </label>

                            {stockUnitHasNetwork && (
                                <div className="space-y-2">
                                    <Label>Network</Label>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                        {networkOptions.map((option) => {
                                            const selected =
                                                stockUnitForm.watch(
                                                    'network_compatibility',
                                                ) === option.value;

                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() =>
                                                        stockUnitForm.setValue(
                                                            'network_compatibility',
                                                            option.value,
                                                            {
                                                                shouldValidate: true,
                                                            },
                                                        )
                                                    }
                                                    className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                                                        selected
                                                            ? option.value ===
                                                              'sim_free'
                                                                ? 'border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                : 'border-red-500 bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                                                            : 'border-border bg-card text-muted-foreground hover:border-border'
                                                    }`}
                                                >
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {stockUnitForm.formState.errors
                                .network_compatibility && (
                                <p className="text-xs text-destructive">
                                    {
                                        stockUnitForm.formState.errors
                                            .network_compatibility.message
                                    }
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="note">Note</Label>
                            <Textarea
                                id="note"
                                rows={3}
                                placeholder="Optional internal note..."
                                {...stockUnitForm.register('note')}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsStockModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submittingStock}>
                                {submittingStock
                                    ? 'Saving...'
                                    : editingStockUnit
                                      ? 'Update Stock'
                                      : 'Add Stock'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE DIALOG */}
            <AlertDialog
                open={!!deletingId}
                onOpenChange={() => {
                    setDeletingId(null);
                    setDeletingType(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete{' '}
                            {deletingType === 'stockUnit'
                                ? 'Stock Unit'
                                : 'Variant'}
                            ?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            This action cannot be undone. The selected{' '}
                            {deletingType === 'stockUnit'
                                ? 'stock unit'
                                : 'product variant'}{' '}
                            will be deleted.
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
