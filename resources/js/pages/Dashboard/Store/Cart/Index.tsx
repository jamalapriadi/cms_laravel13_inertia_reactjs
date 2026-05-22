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

interface Cart {
    id: string;
    user_id: string | null;
    user?: {
        id: string;
        name: string;
        email: string;
    } | null;
    total_price: number;
    total_qty: number;
    created_at: string;
    updated_at: string;
}

interface Summary {
    total_carts: number;
    active_carts: number;
    abandoned_carts: number;
    total_items: number;
    total_value: number;
    avg_cart_value: number;
    abandonment_rate: number;
}

interface TopProduct {
    id: string;
    name: string;
    qty: number;
}

interface Props {
    carts: LaravelPagination<Cart>;
    summary: Summary;
    top_products: TopProduct[];
    filters: {
        search?: string;
        user_type?: string;
    };
}

export default function Index({
    carts,
    summary,
    top_products,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [userType, setUserType] = useState(filters.user_type || '');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const applyFilter = () => {
        router.get(
            '/dashboard/ecommerce/carts',
            {
                search,
                user_type: userType,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearFilter = () => {
        setSearch('');
        setUserType('');
        router.get(
            '/dashboard/ecommerce/carts',
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDelete = () => {
        if (!deletingId) {
            return;
        }
        router.delete(`/dashboard/ecommerce/carts/${deletingId}`, {
            onFinish: () => setDeletingId(null),
        });
    };

    const columns = [
        {
            label: 'Cart ID',
            render: (row: Cart) => (
                <div className="flex flex-col">
                    <span className="max-w-[120px] truncate font-mono text-xs font-semibold text-foreground">
                        {row.id}
                    </span>
                    <span className="mt-0.5 text-[10px] text-muted-foreground">
                        Created:{' '}
                        {new Date(row.created_at).toLocaleDateString('id-ID')}
                    </span>
                </div>
            ),
        },
        {
            label: 'User / Owner',
            render: (row: Cart) => (
                <div className="flex flex-col">
                    {row.user ? (
                        <>
                            <span className="text-sm font-semibold text-foreground">
                                {row.user.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {row.user.email}
                            </span>
                        </>
                    ) : (
                        <span className="inline-flex w-fit items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            Guest / Anonymous
                        </span>
                    )}
                </div>
            ),
        },
        {
            label: 'Total Items',
            render: (row: Cart) => (
                <span className="text-sm font-medium text-foreground">
                    {row.total_qty} pcs
                </span>
            ),
        },
        {
            label: 'Total Value',
            render: (row: Cart) => (
                <span className="text-sm font-semibold text-foreground">
                    Rp {Number(row.total_price).toLocaleString('id-ID')}
                </span>
            ),
        },
        {
            label: 'Last Active',
            render: (row: Cart) => {
                const date = new Date(row.updated_at);
                const diffTime = Math.abs(
                    new Date().getTime() - date.getTime(),
                );
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

                let activeText = '';
                if (diffHours < 1) {
                    activeText = 'Just now';
                } else if (diffHours < 24) {
                    activeText = `${diffHours} hours ago`;
                } else {
                    activeText = `${diffDays} days ago`;
                }

                // Check if abandoned
                const isAbandoned = diffHours >= 24;

                return (
                    <div className="flex flex-col">
                        <span className="text-sm text-foreground">
                            {activeText}
                        </span>
                        <span
                            className={`mt-0.5 text-[10px] font-semibold tracking-wider uppercase ${
                                isAbandoned
                                    ? 'text-amber-700 dark:text-amber-300'
                                    : 'text-emerald-700 dark:text-emerald-300'
                            }`}
                        >
                            {isAbandoned ? 'Abandoned' : 'Active'}
                        </span>
                    </div>
                );
            },
        },
        {
            label: 'Actions',
            render: (row: Cart) => (
                <div className="flex gap-2">
                    <Link href={`/dashboard/ecommerce/carts/${row.id}`}>
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-primary/50 text-primary hover:bg-primary/5"
                        >
                            Details
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

    const maxQty =
        top_products.length > 0
            ? Math.max(...top_products.map((p) => p.qty))
            : 1;

    return (
        <>
            <Head title="Carts & E-Commerce Insights" />

            <div className="container mx-auto space-y-8 px-4 py-6">
                {/* TITLE & HEADER */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                        Shopping Carts & Insights
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Analyze shopping cart behavior, observe abandonment
                        trends, and manage active customer carts.
                    </p>
                </div>

                <hr className="border-border" />

                {/* INSIGHTS METRICS GRID */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* TOTAL CARTS */}
                    <div className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
                        <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-primary/5 transition-transform group-hover:scale-110" />
                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            Total Carts
                        </span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-foreground">
                                {summary.total_carts}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                carts
                            </span>
                        </div>
                    </div>

                    {/* TOTAL VALUE */}
                    <div className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
                        <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-emerald-500/5 transition-transform group-hover:scale-110" />
                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            Cumulative Value
                        </span>
                        <div className="mt-2 flex flex-col">
                            <span className="text-xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
                                Rp {summary.total_value.toLocaleString('id-ID')}
                            </span>
                            <span className="mt-0.5 text-[10px] text-muted-foreground">
                                from {summary.total_items} items in carts
                            </span>
                        </div>
                    </div>

                    {/* AVERAGE VALUE */}
                    <div className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
                        <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-blue-500/5 transition-transform group-hover:scale-110" />
                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            Average Cart Value
                        </span>
                        <div className="mt-2 flex flex-col">
                            <span className="text-xl font-bold tracking-tight text-blue-600">
                                Rp{' '}
                                {Math.round(
                                    summary.avg_cart_value,
                                ).toLocaleString('id-ID')}
                            </span>
                            <span className="mt-0.5 text-[10px] text-muted-foreground">
                                average order potential
                            </span>
                        </div>
                    </div>

                    {/* ABANDONMENT RATE */}
                    <div className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
                        <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-amber-500/5 transition-transform group-hover:scale-110" />
                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            Abandonment Rate
                        </span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-amber-700 dark:text-amber-300">
                                {summary.abandonment_rate}%
                            </span>
                            <span className="text-xs text-muted-foreground">
                                ({summary.abandoned_carts} idle carts)
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* FILTERS & CARTS TABLE */}
                    <div className="space-y-6 lg:col-span-2">
                        <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
                            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                                Filter Carts
                            </h2>
                            <div className="flex flex-wrap items-end gap-3">
                                <div className="min-w-[200px] flex-1 space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">
                                        Search Customer Name/ID
                                    </label>
                                    <Input
                                        placeholder="Search..."
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            e.key === 'Enter' && applyFilter()
                                        }
                                    />
                                </div>

                                <div className="w-[180px] space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">
                                        User Type
                                    </label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        value={userType}
                                        onChange={(e) =>
                                            setUserType(e.target.value)
                                        }
                                    >
                                        <option value="">All Carts</option>
                                        <option value="registered">
                                            Registered Only
                                        </option>
                                        <option value="guest">
                                            Guest Only
                                        </option>
                                    </select>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={applyFilter}
                                        className="shadow-sm"
                                    >
                                        Apply Filter
                                    </Button>
                                    {(filters.search || filters.user_type) && (
                                        <Button
                                            onClick={clearFilter}
                                            variant="outline"
                                        >
                                            Reset
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CARTS TABLE */}
                        <div className="overflow-hidden rounded-xl border bg-card p-1 shadow-sm">
                            <DataTable<Cart>
                                data={carts.data}
                                columns={columns}
                            />
                        </div>

                        {/* PAGINATION */}
                        {carts.links.length > 3 && (
                            <div className="flex items-center justify-center gap-1.5">
                                {carts.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url && router.visit(link.url)
                                        }
                                        className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                                            link.active
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:bg-muted'
                                        } ${!link.url && 'cursor-not-allowed opacity-40'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* TOP PRODUCT INSIGHTS PANEL */}
                    <div className="h-fit space-y-6 rounded-xl border bg-card p-5 shadow-sm">
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-foreground">
                                Top Added Products
                            </h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Products with the highest quantities currently
                                added to customer carts.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {top_products.length > 0 ? (
                                top_products.map((product, index) => {
                                    const percent =
                                        (product.qty / maxQty) * 100;
                                    return (
                                        <div
                                            key={product.id}
                                            className="space-y-1"
                                        >
                                            <div className="flex items-baseline justify-between text-xs">
                                                <span className="max-w-[180px] truncate font-semibold text-foreground">
                                                    {product.name}
                                                </span>
                                                <span className="ml-2 shrink-0 font-medium text-muted-foreground">
                                                    {product.qty} pcs
                                                </span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-primary transition-all duration-500"
                                                    style={{
                                                        width: `${percent}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    No products in carts.
                                </div>
                            )}
                        </div>

                        <hr className="border-border" />

                        <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                Ecommerce Hint
                            </span>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                High cart abandonment rates (typically &gt; 70%)
                                may indicate friction during checkout,
                                uncompetitive pricing, or high shipping fees.
                                Consider launching email reminders or offering
                                discounts on top carted items.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* DELETE ALERT DIALOG */}
            <AlertDialog
                open={!!deletingId}
                onOpenChange={() => setDeletingId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete Customer Cart?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this cart? All items
                            inside the cart will be removed. This cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Yes, Delete Cart
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
