import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

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
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/master-data-layout';
import { mediaUrl } from '@/lib/media';
import { formatRupiah } from '@/lib/utils';
import type { LaravelPagination } from '@/types/LaravelPagination';

interface Product {
    id: string;
    name: string;
}

interface VariantOption {
    id: string;
    value: string;
    variant?: {
        id: string;
        name: string;
    };
}

interface VariantItem {
    id: string;
    product_id: string;
    sku: string;
    name: string;
    image?: string | null;
    buying_price: string | number;
    selling_price: string | number;
    stock: number;
    available_stock_units_count?: number;
    is_active: boolean;
    product?: Product;
    options?: VariantOption[];
}

interface Props {
    variantItems: LaravelPagination<VariantItem>;
    products: Product[];
    filters: {
        search?: string;
        product_id?: string;
    };
}

const money = (value: string | number | null | undefined) =>
    formatRupiah(value);

export default function Index({ variantItems, products, filters }: Props) {
    const mediaUrlBase = (usePage().props as { mediaUrlBase?: string })
        .mediaUrlBase;
    const [search, setSearch] = useState(filters.search || '');
    const [productId, setProductId] = useState(filters.product_id || '');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const applyFilter = () => {
        router.get(
            '/my-admin/dashboard/ecommerce/variant-items',
            { search, product_id: productId },
            { preserveState: true, replace: true },
        );
    };

    const columns = [
        {
            label: 'Product',
            render: (row: VariantItem) => row.product?.name || '-',
        },
        {
            label: 'Variant Item',
            render: (row: VariantItem) => (
                <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.sku}</p>
                </div>
            ),
        },
        {
            label: 'Options',
            render: (row: VariantItem) => {
                const options = row.options ?? [];

                if (!options.length) {
                    return (
                        <span className="text-sm text-muted-foreground">
                            No options
                        </span>
                    );
                }

                return (
                    <div className="flex max-w-xs flex-wrap gap-2 sm:max-w-sm md:max-w-md">
                        {options.map((option) => (
                            <div
                                key={option.id}
                                className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs shadow-sm transition-colors hover:bg-muted"
                                title={`${option.variant?.name ?? 'Option'}: ${option.value}`}
                            >
                                {option.variant?.name && (
                                    <span className="max-w-22.5 truncate text-muted-foreground">
                                        {option.variant.name}
                                    </span>
                                )}

                                {option.variant?.name && (
                                    <span className="text-muted-foreground">
                                        :
                                    </span>
                                )}

                                <span className="max-w-30 truncate font-medium">
                                    {option.value}
                                </span>
                            </div>
                        ))}
                    </div>
                );
            },
        },
        {
            label: 'Image',
            render: (row: VariantItem) =>
                row.image ? (
                    <img
                        src={mediaUrl(row.image, mediaUrlBase) ?? ''}
                        alt={row.name}
                        className="h-10 w-10 rounded-md border object-cover"
                    />
                ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                ),
        },
        {
            label: 'Buying',
            render: (row: VariantItem) => money(row.buying_price),
        },
        {
            label: 'Selling',
            render: (row: VariantItem) => (
                <span className="font-medium">{money(row.selling_price)}</span>
            ),
        },
        {
            label: 'Stock',
            render: (row: VariantItem) =>
                row.available_stock_units_count ?? row.stock,
        },
        {
            label: 'Status',
            render: (row: VariantItem) => (
                <Badge variant={row.is_active ? 'default' : 'destructive'}>
                    {row.is_active ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            label: 'Action',
            render: (row: VariantItem) => (
                <div className="flex gap-2">
                    <Link
                        href={`/my-admin/dashboard/ecommerce/variant-items/${row.id}/edit`}
                    >
                        <Button size="icon" variant="secondary" title="Edit">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button
                        size="icon"
                        variant="destructive"
                        title="Delete"
                        onClick={() => setDeletingId(row.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Variant Items" />

            <div className="container mx-auto space-y-8 px-6 py-10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Variant Items</h1>
                        <p className="text-muted-foreground">
                            SKU hasil kombinasi opsi variant.
                        </p>
                    </div>
                    <Link
                        href={`/my-admin/dashboard/ecommerce/variant-items/create${productId ? `?product_id=${productId}` : ''}`}
                    >
                        <Button>
                            <Plus className="h-4 w-4" />
                            Add Variant Item
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div>
                        <Input
                            className="max-w-xs"
                            placeholder="Search SKU, item, option..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && applyFilter()
                            }
                        />
                    </div>

                    <div>
                        <SearchableSelect
                            className="min-w-64"
                            options={products.map((product) => ({
                                value: product.id,
                                label: product.name,
                            }))}
                            value={productId}
                            onChange={(value) => setProductId(value ?? '')}
                            placeholder="All Products"
                            clearable
                        />
                    </div>

                    <Button onClick={applyFilter}>Apply Filter</Button>
                </div>

                <DataTable<VariantItem>
                    data={variantItems.data}
                    columns={columns}
                />

                <div className="flex flex-wrap gap-2">
                    {variantItems.links.map((link, i) => (
                        <button
                            key={i}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            disabled={!link.url}
                            onClick={() => link.url && router.visit(link.url)}
                            className={`rounded px-3 py-1 text-sm ${
                                link.active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                            } ${!link.url ? 'opacity-50' : ''}`}
                        />
                    ))}
                </div>
            </div>

            <AlertDialog
                open={!!deletingId}
                onOpenChange={(open) => !open && setDeletingId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete variant item?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            SKU dan relasi opsi akan dihapus dari daftar.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                deletingId &&
                                router.delete(
                                    `/my-admin/dashboard/ecommerce/variant-items/${deletingId}`,
                                    { onFinish: () => setDeletingId(null) },
                                )
                            }
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
