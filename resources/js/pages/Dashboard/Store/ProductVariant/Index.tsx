import { Head, Link, router } from '@inertiajs/react';
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
import type { LaravelPagination } from '@/types/LaravelPagination';

interface Product {
    id: string;
    name: string;
}

interface ProductVariantOption {
    id: string;
    value: string;
}

interface ProductVariant {
    id: string;
    product_id: string;
    name: string;
    options?: ProductVariantOption[];
    options_count?: number;
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

export default function Index({
    variants,
    products = [],
    filters = {},
}: Props) {
    const productOptions = Array.isArray(products) ? products : [];
    const variantRows = Array.isArray(variants?.data) ? variants.data : [];
    const [search, setSearch] = useState(filters.search || '');
    const [productId, setProductId] = useState(filters.product_id || '');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const applyFilter = () => {
        router.get(
            '/my-admin/dashboard/ecommerce/product-variants',
            { search, product_id: productId },
            { preserveState: true, replace: true },
        );
    };

    const columns = [
        {
            label: 'Product',
            render: (row: ProductVariant) => row.product?.name || '-',
        },
        {
            label: 'Variant',
            render: (row: ProductVariant) => (
                <span className="font-medium">{row.name}</span>
            ),
        },
        {
            label: 'Options',
            render: (row: ProductVariant) => (
                <div className="flex max-w-xl flex-wrap gap-2">
                    {(row.options ?? []).map((option) => (
                        <Badge key={option.id} variant="secondary">
                            {option.value}
                        </Badge>
                    ))}
                    {(row.options ?? []).length === 0 && (
                        <span className="text-sm text-muted-foreground">-</span>
                    )}
                </div>
            ),
        },
        {
            label: 'Action',
            render: (row: ProductVariant) => (
                <div className="flex gap-2">
                    <Link
                        href={`/my-admin/dashboard/ecommerce/product-variants/${row.id}/edit`}
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
            <Head title="Product Variants" />

            <div className="container mx-auto space-y-8 px-6 py-10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Product Variants</h1>
                        <p className="text-muted-foreground">
                            Kelola jenis variant seperti Warna, Storage, Size,
                            dan opsi-opsinya.
                        </p>
                    </div>
                    <Link
                        href={`/my-admin/dashboard/ecommerce/product-variants/create${productId ? `?product_id=${productId}` : ''}`}
                    >
                        <Button>
                            <Plus className="h-4 w-4" />
                            Add Variant
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-wrap justify-start gap-3">
                    <div>
                        <Input
                            className="max-w-xs"
                            placeholder="Search product, variant, option..."
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
                            options={productOptions.map((product) => ({
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

                <DataTable<ProductVariant>
                    data={variantRows}
                    columns={columns}
                />

                <div className="flex flex-wrap gap-2">
                    {(variants?.links ?? []).map((link, i) => (
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
                        <AlertDialogTitle>Delete variant?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Opsi variant ikut terhapus. Variant item yang
                            memakai opsi ini perlu dibuat ulang.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                deletingId &&
                                router.delete(
                                    `/my-admin/dashboard/ecommerce/product-variants/${deletingId}`,
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
