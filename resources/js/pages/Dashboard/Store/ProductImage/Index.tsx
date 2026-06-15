import { Head, Link, router, usePage } from '@inertiajs/react';
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

import { Button } from '@/components/ui/button';

import AppLayout from '@/layouts/master-data-layout';
import { mediaUrl } from '@/lib/media';

import type { LaravelPagination } from '@/types/LaravelPagination';

/**
 * TYPE
 */
interface Product {
    id: string;
    name: string;
}

interface ProductImage {
    id: string;
    product_id: string;
    image: string;
    is_primary: boolean;
    sort_order: number;
    created_at: string;
    product?: Product;
}

interface Props {
    images: LaravelPagination<ProductImage>;
    products: Product[];

    filters: {
        product_id?: string;
    };
}

export default function Index({ images, products, filters }: Props) {
    const mediaUrlBase = (usePage().props as { mediaUrlBase?: string })
        .mediaUrlBase;
    const [productId, setProductId] = useState(filters.product_id || '');

    const [deletingId, setDeletingId] = useState<string | null>(null);

    /**
     * FILTER
     */
    const applyFilter = () => {
        router.get(
            '/my-admin/dashboard/ecommerce/product-images',
            {
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
    const handleDelete = () => {
        if (!deletingId) {
            return;
        }

        router.delete(
            `/my-admin/dashboard/ecommerce/product-images/${deletingId}`,
            {
                onFinish: () => setDeletingId(null),
            },
        );
    };

    /**
     * TABLE COLUMNS
     */
    const columns = [
        {
            label: 'Image',
            render: (row: ProductImage) => (
                <img
                    src={mediaUrl(row.image, mediaUrlBase) ?? ''}
                    alt="Product Image"
                    className="h-16 w-16 rounded-md border bg-muted object-contain p-1"
                />
            ),
        },
        {
            label: 'Product',
            render: (row: ProductImage) => (
                <span className="text-sm font-medium">
                    {row.product?.name || '-'}
                </span>
            ),
        },
        {
            label: 'Is Primary',
            render: (row: ProductImage) => (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.is_primary
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'bg-muted/50 text-foreground'
                    }`}
                >
                    {row.is_primary ? 'Primary' : 'Secondary'}
                </span>
            ),
        },
        {
            label: 'Sort Order',
            render: (row: ProductImage) => (
                <span className="text-sm">{row.sort_order}</span>
            ),
        },
        {
            label: 'Action',
            render: (row: ProductImage) => (
                <div className="flex gap-2">
                    <Link
                        href={`/my-admin/dashboard/ecommerce/product-images/${row.id}/edit`}
                    >
                        <Button size="sm" variant="secondary">
                            Edit
                        </Button>
                    </Link>

                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletingId(row.id)}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Product Images" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Product Images</h1>

                        <p className="text-muted-foreground">
                            Manage additional gallery images for products
                        </p>
                    </div>

                    <Link
                        href={`/my-admin/dashboard/ecommerce/product-images/create${productId ? `?product_id=${productId}` : ''}`}
                    >
                        <Button>Add Product Image</Button>
                    </Link>
                </div>

                <hr />

                {/* FILTER */}
                <div className="flex flex-wrap gap-3">
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

                    <Button onClick={applyFilter}>Apply Filter</Button>
                </div>

                {/* TABLE */}
                <DataTable<ProductImage> data={images.data} columns={columns} />

                {/* PAGINATION */}
                <div className="flex flex-wrap gap-2">
                    {images.links.map((link, i) => (
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

            {/* DELETE DIALOG */}
            <AlertDialog
                open={!!deletingId}
                onOpenChange={() => setDeletingId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Image?</AlertDialogTitle>

                        <AlertDialogDescription>
                            This action cannot be undone. The selected image
                            will be permanently removed.
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
