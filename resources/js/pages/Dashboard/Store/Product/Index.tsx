import { Head, Link, router } from '@inertiajs/react';
import { Boxes, Package, Tags, Warehouse } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent, ElementType } from 'react';

import { DataTable } from '@/components/DataTable';
import SearchableSelect from '@/components/SearchableSelect';
import { formatRupiah } from '@/lib/utils';

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
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const openImportDialog = () => {
        setIsImportDialogOpen(true);
    };

    const closeImportDialog = () => {
        setIsImportDialogOpen(false);
    };

    const downloadImportTemplate = () => {
        window.location.href =
            '/my-admin/dashboard/ecommerce/products/template';
    };

    const triggerImport = () => {
        fileInputRef.current?.click();
    };

    const handleImportFile = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.currentTarget.files?.[0];

        if (!file) {
            return;
        }

        router.post(
            '/my-admin/dashboard/ecommerce/products/import',
            { file },
            {
                forceFormData: true,
                preserveState: true,
                onSuccess: () => {
                    event.currentTarget.value = '';
                    setIsImportDialogOpen(false);
                },
            },
        );
    };

    const exportProducts = () => {
        const params = new URLSearchParams();

        if (search) params.append('search', search);
        if (categoryId) params.append('category_id', categoryId);
        if (brandId) params.append('brand_id', brandId);

        window.location.href = `/my-admin/dashboard/ecommerce/products/export${params.toString() ? `?${params.toString()}` : ''}`;
    };

    /**
     * FILTER
     */
    const applyFilter = () => {
        router.get(
            '/my-admin/dashboard/ecommerce/products',
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

        router.delete(`/my-admin/dashboard/ecommerce/products/${deletingId}`, {
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
                    {formatRupiah(row.base_price)}
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
                            ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
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
                    <Link
                        href={`/my-admin/dashboard/ecommerce/products/${row.id}`}
                    >
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-primary/50 text-primary hover:bg-primary/5"
                        >
                            Detail
                        </Button>
                    </Link>

                    <Link
                        href={`/my-admin/dashboard/ecommerce/products/${row.id}/edit`}
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
            <Head title="Products" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Products</h1>

                        <p className="text-muted-foreground">
                            List of registered products
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={exportProducts}>
                            Export Excel
                        </Button>

                        <Button variant="secondary" onClick={openImportDialog}>
                            Import Excel
                        </Button>

                        <Link href="/my-admin/dashboard/ecommerce/products/create">
                            <Button>Add Product</Button>
                        </Link>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={handleImportFile}
                    />

                    <AlertDialog
                        open={isImportDialogOpen}
                        onOpenChange={setIsImportDialogOpen}
                    >
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Import Produk dari Excel
                                </AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogDescription>
                                Unggah file Excel (.xlsx, .xls, .csv) berisi
                                daftar produk dengan kolom yang sesuai. Gunakan
                                template import untuk memastikan format data dan
                                gunakan nama atau slug untuk kategori, brand,
                                dan unit jika ID tidak tersedia.
                            </AlertDialogDescription>

                            <div className="mt-4 rounded-xl border border-border bg-muted p-4 text-sm text-foreground">
                                <p className="font-semibold">
                                    Format kolom yang didukung:
                                </p>
                                <ul className="mt-2 list-disc space-y-1 pl-5">
                                    <li>
                                        <strong>name</strong>,{' '}
                                        <strong>slug</strong>,{' '}
                                        <strong>sku</strong>
                                    </li>
                                    <li>
                                        <strong>category_id</strong>,{' '}
                                        <strong>category_slug</strong>,{' '}
                                        <strong>category_name</strong>
                                    </li>
                                    <li>
                                        <strong>brand_id</strong>,{' '}
                                        <strong>brand_slug</strong>,{' '}
                                        <strong>brand_name</strong>
                                    </li>
                                    <li>
                                        <strong>unit_id</strong>,{' '}
                                        <strong>unit_code</strong>,{' '}
                                        <strong>unit_name</strong>
                                    </li>
                                    <li>
                                        <strong>condition</strong> (new /
                                        like_new / second)
                                    </li>
                                    <li>
                                        <strong>base_price</strong>,{' '}
                                        <strong>has_variant</strong> (0/1),{' '}
                                        <strong>is_publish</strong> (0/1)
                                    </li>
                                    <li>
                                        <strong>thumbnail</strong>,{' '}
                                        <strong>description</strong>,{' '}
                                        <strong>meta_title</strong>,{' '}
                                        <strong>meta_description</strong>
                                    </li>
                                </ul>
                            </div>

                            <AlertDialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={downloadImportTemplate}
                                >
                                    Download Template
                                </Button>
                                <Button onClick={triggerImport}>
                                    Pilih File untuk Upload
                                </Button>
                                <AlertDialogCancel onClick={closeImportDialog}>
                                    Batal
                                </AlertDialogCancel>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
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
                <div className="justifty-between flex flex-wrap gap-3">
                    <div>
                        <Input
                            className="max-w-xs"
                            placeholder="Search product name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && applyFilter()
                            }
                        />
                    </div>

                    <div>
                        <SearchableSelect
                            className="min-w-56"
                            options={categories.map((cat) => ({
                                value: cat.id,
                                label: cat.name,
                            }))}
                            value={categoryId}
                            onChange={(value) => setCategoryId(value ?? '')}
                            placeholder="All Categories"
                            clearable
                        />
                    </div>

                    <div>
                        <SearchableSelect
                            className="min-w-56"
                            options={brands.map((brand) => ({
                                value: brand.id,
                                label: brand.name,
                            }))}
                            value={brandId}
                            onChange={(value) => setBrandId(value ?? '')}
                            placeholder="All Brands"
                            clearable
                        />
                    </div>

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
