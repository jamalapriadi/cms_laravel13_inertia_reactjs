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

interface ProductVariant {
    id: string;
    product_id: string;
    name: string;
    sku: string;
    price: string | number;
    stock: number;
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

export default function Index({ variants, products, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [productId, setProductId] = useState(filters.product_id || '');

    const [deletingId, setDeletingId] = useState<string | null>(null);

    /**
     * FILTER
     */
    const applyFilter = () => {
        router.get(
            '/dashboard/ecommerce/product-variants',
            { 
                search,
                product_id: productId 
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

        router.delete(`/dashboard/ecommerce/product-variants/${deletingId}`, {
            onFinish: () => setDeletingId(null),
        });
    };

    /**
     * TABLE COLUMNS
     */
    const columns = [
        {
            label: 'Name',
            render: (row: ProductVariant) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.name}</span>
                    <span className="text-xs text-muted-foreground">SKU: {row.sku}</span>
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
            render: (row: ProductVariant) => (
                <span className={`text-sm font-bold ${row.stock <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {row.stock}
                </span>
            ),
        },
        {
            label: 'Status',
            render: (row: ProductVariant) => (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.is_active
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
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
                    <Link href={`/dashboard/ecommerce/product-variants/${row.id}/edit`}>
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
            <Head title="Product Variants" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Product Variants</h1>

                        <p className="text-gray-500">
                            List of registered product variants
                        </p>
                    </div>

                    <Link href="/dashboard/ecommerce/product-variants/create">
                        <Button>Add Variant</Button>
                    </Link>
                </div>

                <hr />

                {/* FILTER */}
                <div className="flex gap-3 flex-wrap">
                    <Input
                        className="max-w-xs"
                        placeholder="Search variant or SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                    />

                    <select
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                <DataTable<ProductVariant> data={variants.data} columns={columns} />

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

            {/* DELETE DIALOG */}
            <AlertDialog
                open={!!deletingId}
                onOpenChange={() => setDeletingId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Variant?</AlertDialogTitle>

                        <AlertDialogDescription>
                            This action cannot be undone. The selected product variant
                            will be permanently deleted.
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
