import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { DataTable } from '@/components/DataTable';
import SearchableSelect from '@/components/SearchableSelect';
import type { SearchableSelectOption } from '@/components/SearchableSelect';
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
import { Label } from '@/components/ui/label';
import type { LaravelPagination } from '@/types/LaravelPagination';

interface ProductCollection {
    id: string;
    name: string;
    slug: string;
    type: string | null;
    title: string | null;
    description: string | null;
    banner_image_url: string | null;
    is_active: boolean;
    show_home: boolean;
    start_at: string | null;
    end_at: string | null;
    sort_order: number;
    items_count: number;
}

interface ProductCollectionItem {
    id: string;
    product_id: string;
    variant_item_id: string | null;
    product_name: string | null;
    product_slug: string | null;
    variant_name: string | null;
    sku: string | null;
    price: number;
    image: string | null;
    stock: number | null;
    sort_order: number;
}

interface VariantOption {
    id: string;
    name: string;
    options_label: string;
    sku: string;
    selling_price: number;
    stock: number;
    is_active: boolean;
}

interface ProductOption {
    product_id: string;
    product_name: string;
    product_slug: string;
    product_sku: string | null;
    has_variant: boolean;
    variant_items: VariantOption[];
}

interface Props {
    collection: ProductCollection;
    items: LaravelPagination<ProductCollectionItem>;
    filters: {
        search: string;
    };
}

interface AddItemFormData {
    product_id: string;
    variant_item_id: string;
    sort_order: number;
}

export default function Show({ collection, items, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [sortDrafts, setSortDrafts] = useState<Record<string, number>>({});

    const [productKeyword, setProductKeyword] = useState('');
    const [productLoading, setProductLoading] = useState(false);
    const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

    const { data, setData, post, processing, errors, reset } =
        useForm<AddItemFormData>({
            product_id: '',
            variant_item_id: '',
            sort_order: 0,
        });

    const selectedProduct = useMemo(
        () =>
            productOptions.find(
                (product) => product.product_id === data.product_id,
            ) ?? null,
        [productOptions, data.product_id],
    );

    const selectedVariantOptions = useMemo<SearchableSelectOption[]>(() => {
        if (!selectedProduct) {
            return [];
        }

        return selectedProduct.variant_items.map((variantItem) => ({
            value: variantItem.id,
            label: variantItem.options_label
                ? `${variantItem.name} (${variantItem.options_label})`
                : variantItem.name,
            description: `${variantItem.sku} | Rp ${formatNumber(variantItem.selling_price)}`,
        }));
    }, [selectedProduct]);

    const productSelectOptions = useMemo<SearchableSelectOption[]>(() => {
        return productOptions.map((product) => ({
            value: product.product_id,
            label: product.product_name,
            description: product.product_sku
                ? `${product.product_sku} | ${product.product_slug}`
                : product.product_slug,
        }));
    }, [productOptions]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void fetchProducts(productKeyword);
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [productKeyword]);

    useEffect(() => {
        void fetchProducts('');
    }, []);

    const fetchProducts = async (keyword: string) => {
        setProductLoading(true);

        try {
            const response = await fetch(
                `/my-admin/dashboard/ecommerce/product-collections/options/products?query=${encodeURIComponent(keyword)}&limit=20`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            if (!response.ok) {
                return;
            }

            const payload = (await response.json()) as ProductOption[];

            setProductOptions((current) => {
                const merged = [...current, ...payload];
                const deduped = merged.filter(
                    (item, index, array) =>
                        array.findIndex(
                            (target) => target.product_id === item.product_id,
                        ) === index,
                );

                if (!keyword.trim()) {
                    return payload;
                }

                return deduped;
            });
        } finally {
            setProductLoading(false);
        }
    };

    const applySearch = () => {
        router.get(
            `/my-admin/dashboard/ecommerce/product-collections/${collection.id}`,
            {
                search: search || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleAddItem = (event: React.FormEvent) => {
        event.preventDefault();

        post(
            `/my-admin/dashboard/ecommerce/product-collections/${collection.id}/items`,
            {
                onSuccess: () => {
                    reset('product_id', 'variant_item_id', 'sort_order');
                },
            },
        );
    };

    const updateSort = (row: ProductCollectionItem) => {
        const draftSort = sortDrafts[row.id] ?? row.sort_order;

        router.put(
            `/my-admin/dashboard/ecommerce/product-collections/${collection.id}/items/${row.id}`,
            {
                product_id: row.product_id,
                variant_item_id: row.variant_item_id,
                sort_order: draftSort,
            },
            {
                preserveScroll: true,
            },
        );
    };

    const handleDelete = () => {
        if (!deletingId) {
            return;
        }

        router.delete(
            `/my-admin/dashboard/ecommerce/product-collections/${collection.id}/items/${deletingId}`,
            {
                onFinish: () => setDeletingId(null),
            },
        );
    };

    const columns = [
        {
            label: 'Image',
            render: (row: ProductCollectionItem) =>
                row.image ? (
                    <img
                        src={row.image}
                        alt={row.product_name || '-'}
                        className="h-12 w-12 rounded-md border object-cover"
                    />
                ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-md border text-xs text-muted-foreground">
                        N/A
                    </div>
                ),
        },
        {
            label: 'Product',
            render: (row: ProductCollectionItem) => (
                <div>
                    <p className="font-medium">{row.product_name || '-'}</p>
                    <p className="text-xs text-muted-foreground">
                        {row.product_slug || '-'}
                    </p>
                </div>
            ),
        },
        {
            label: 'Variant',
            render: (row: ProductCollectionItem) => (
                <span className="text-sm">{row.variant_name || '-'}</span>
            ),
        },
        {
            label: 'SKU',
            render: (row: ProductCollectionItem) => (
                <span className="font-mono text-xs">{row.sku || '-'}</span>
            ),
        },
        {
            label: 'Price',
            render: (row: ProductCollectionItem) => (
                <span className="text-sm font-medium">
                    Rp {formatNumber(row.price)}
                </span>
            ),
        },
        {
            label: 'Stock',
            render: (row: ProductCollectionItem) => (
                <span className="text-sm">{row.stock ?? '-'}</span>
            ),
        },
        {
            label: 'Sort Order',
            render: (row: ProductCollectionItem) => (
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        min={0}
                        className="w-20"
                        value={sortDrafts[row.id] ?? row.sort_order}
                        onChange={(event) =>
                            setSortDrafts((current) => ({
                                ...current,
                                [row.id]: Number(event.target.value || 0),
                            }))
                        }
                    />
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateSort(row)}
                    >
                        <Save className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ),
        },
        {
            label: 'Actions',
            render: (row: ProductCollectionItem) => (
                <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeletingId(row.id)}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            ),
        },
    ];

    return (
        <>
            <Head title={`Product Collection - ${collection.name}`} />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                        <Link href="/my-admin/dashboard/ecommerce/product-collections">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                {collection.name}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {collection.slug}
                            </p>
                        </div>
                    </div>

                    <Link
                        href={`/my-admin/dashboard/ecommerce/product-collections/${collection.id}/edit`}
                    >
                        <Button variant="secondary">Edit Collection</Button>
                    </Link>
                </div>

                <div className="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-sm md:grid-cols-2 lg:grid-cols-4">
                    <Info label="Type" value={collection.type || '-'} />
                    <Info
                        label="Show Home"
                        value={collection.show_home ? 'Yes' : 'No'}
                    />
                    <Info
                        label="Status"
                        value={collection.is_active ? 'Active' : 'Inactive'}
                    />
                    <Info
                        label="Items Count"
                        value={String(collection.items_count)}
                    />
                </div>

                {collection.title ||
                collection.description ||
                collection.banner_image_url ? (
                    <div className="space-y-3 rounded-xl border border-border bg-card p-6 shadow-sm">
                        {collection.banner_image_url && (
                            <img
                                src={collection.banner_image_url}
                                alt={collection.name}
                                className="h-40 w-full rounded-md border object-cover md:w-[420px]"
                            />
                        )}
                        {collection.title && (
                            <h2 className="text-lg font-semibold">
                                {collection.title}
                            </h2>
                        )}
                        {collection.description && (
                            <p className="text-sm text-muted-foreground">
                                {collection.description}
                            </p>
                        )}
                    </div>
                ) : null}

                <form
                    onSubmit={handleAddItem}
                    className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                    <h2 className="text-lg font-semibold">Add Product Item</h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Product</Label>
                            <SearchableSelect
                                options={productSelectOptions}
                                value={data.product_id || null}
                                onChange={(value) => {
                                    setData('product_id', value || '');
                                    setData('variant_item_id', '');
                                }}
                                placeholder="Search product by name/sku/slug"
                                searchPlaceholder="Type product keyword..."
                                onSearchChange={setProductKeyword}
                                loading={productLoading}
                                error={errors.product_id}
                                filterOptions={false}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Variant Item (Optional)</Label>
                            <SearchableSelect
                                options={selectedVariantOptions}
                                value={data.variant_item_id || null}
                                onChange={(value) =>
                                    setData('variant_item_id', value || '')
                                }
                                placeholder={
                                    selectedProduct
                                        ? 'Select variant item'
                                        : 'Select product first'
                                }
                                disabled={
                                    !selectedProduct ||
                                    selectedVariantOptions.length === 0
                                }
                                clearable
                                error={errors.variant_item_id}
                            />
                            <p className="text-xs text-muted-foreground">
                                Biarkan kosong jika promo berlaku untuk seluruh
                                product.
                            </p>
                        </div>

                        <div className="space-y-2 md:col-span-2 lg:w-48">
                            <Label>Sort Order</Label>
                            <Input
                                type="number"
                                min={0}
                                value={data.sort_order}
                                onChange={(event) =>
                                    setData(
                                        'sort_order',
                                        Number(event.target.value || 0),
                                    )
                                }
                            />
                            {errors.sort_order && (
                                <p className="text-xs text-destructive">
                                    {errors.sort_order}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Adding...' : 'Add Item'}
                        </Button>
                    </div>
                </form>

                <div className="space-y-4">
                    <div className="flex max-w-md gap-3">
                        <Input
                            placeholder="Search item product/sku/variant..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            onKeyDown={(event) =>
                                event.key === 'Enter' && applySearch()
                            }
                        />
                        <Button onClick={applySearch}>Search</Button>
                    </div>

                    <DataTable<ProductCollectionItem>
                        data={items.data}
                        columns={columns}
                    />

                    <div className="flex flex-wrap gap-2">
                        {items.links.map((link, index) => (
                            <button
                                key={`${link.label}-${index}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                disabled={!link.url}
                                onClick={() =>
                                    link.url && router.visit(link.url)
                                }
                                className={`rounded px-3 py-1 text-sm ${
                                    link.active
                                        ? 'bg-primary font-semibold text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-muted'
                                } ${!link.url && 'pointer-events-none opacity-50'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <AlertDialog
                open={!!deletingId}
                onOpenChange={() => setDeletingId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove item?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Item will be removed from this collection only.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-1 text-sm font-medium">{value}</p>
        </div>
    );
}

function formatNumber(value: number): string {
    return Number(value || 0).toLocaleString('id-ID');
}
