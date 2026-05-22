import { Head, Link, router } from '@inertiajs/react';
import { Boxes, Package, Tags, Warehouse } from 'lucide-react';
import { useState } from 'react';
import type { ElementType } from 'react';

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
    category_id: string;
    brand_id?: string | null;
    name: string;
    slug: string;
    base_price: string | number;
    condition: string;
    is_publish: boolean;
    created_at: string;
    category?: {
        id: string;
        name: string;
    };
    brand?: {
        id: string;
        name: string;
    };
}

interface Props {
    products: LaravelPagination<Product>;
    categories: { id: string; name: string }[];
    brands: { id: string; name: string }[];
    summary: {
        products: number;
        product_variants: number;
        brands: number;
        categories: number;
    };

    filters: {
        search?: string;
        category_id?: string;
        brand_id?: string;
    };
}

function SummaryCard({
    title,
    value,
    icon: Icon,
}: {
    title: string;
    value: number;
    icon: ElementType;
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
    products,
    categories,
    brands,
    summary,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [categoryId, setCategoryId] = useState(filters.category_id || '');
    const [brandId, setBrandId] = useState(filters.brand_id || '');

    const [deletingId, setDeletingId] = useState<string | null>(null);

    /**
     * FILTER
     */
    const applyFilter = () => {
        router.get(
            '/dashboard/ecommerce/products',
            {
                search,
                category_id: categoryId,
                brand_id: brandId,
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

        router.delete(`/dashboard/ecommerce/products/${deletingId}`, {
            onFinish: () => setDeletingId(null),
        });
    };

    /**
     * TABLE COLUMNS
     */
    const columns = [
        {
            label: 'Name',
            render: (row: Product) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.name}</span>
                    <span className="text-xs text-muted-foreground">
                        {row.slug}
                    </span>
                </div>
            ),
        },
        {
            label: 'Category',
            render: (row: Product) => (
                <span className="text-sm">{row.category?.name || '-'}</span>
            ),
        },
        {
            label: 'Brand',
            render: (row: Product) => (
                <span className="text-sm">{row.brand?.name || '-'}</span>
            ),
        },
        {
            label: 'Base Price',
            render: (row: Product) => (
                <span className="text-sm font-medium">
                    ¥{Number(row.base_price).toLocaleString('ja-JP')}
                </span>
            ),
        },
        {
            label: 'Condition',
            render: (row: Product) => (
                <span className="text-sm capitalize">
                    {row.condition.replace('_', ' ')}
                </span>
            ),
        },
        {
            label: 'Status',
            render: (row: Product) => (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.is_publish
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                    }`}
                >
                    {row.is_publish ? 'Published' : 'Draft'}
                </span>
            ),
        },
        {
            label: 'Action',
            render: (row: Product) => (
                <div className="flex flex-wrap gap-2">
                    <Link href={`/dashboard/ecommerce/products/${row.id}`}>
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-primary/50 text-primary hover:bg-primary/5"
                        >
                            Detail
                        </Button>
                    </Link>

                    <Link href={`/dashboard/ecommerce/products/${row.id}/edit`}>
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
            <Head title="Products" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Products</h1>

                        <p className="text-gray-500">
                            List of registered products
                        </p>
                    </div>

                    <Link href="/dashboard/ecommerce/products/create">
                        <Button>Add Product</Button>
                    </Link>
                </div>

                <hr />

                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        title="Total Product"
                        value={summary.products}
                        icon={Package}
                    />
                    <SummaryCard
                        title="Total Product Variant"
                        value={summary.product_variants}
                        icon={Boxes}
                    />
                    <SummaryCard
                        title="Total Brand"
                        value={summary.brands}
                        icon={Tags}
                    />
                    <SummaryCard
                        title="Total Category Product"
                        value={summary.categories}
                        icon={Warehouse}
                    />
                </div>

                {/* FILTER */}
                <div className="flex flex-wrap gap-3">
                    <Input
                        className="max-w-xs"
                        placeholder="Search product name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                    />

                    <select
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        value={brandId}
                        onChange={(e) => setBrandId(e.target.value)}
                    >
                        <option value="">All Brands</option>
                        {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                                {brand.name}
                            </option>
                        ))}
                    </select>

                    <Button onClick={applyFilter}>Apply Filter</Button>
                </div>

                {/* TABLE */}
                <DataTable<Product> data={products.data} columns={columns} />

                {/* PAGINATION */}
                <div className="flex flex-wrap gap-2">
                    {products.links.map((link, i) => (
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
                        <AlertDialogTitle>Delete Product?</AlertDialogTitle>

                        <AlertDialogDescription>
                            This action cannot be undone. The selected product
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
