import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
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
// import AppLayout from '@/layouts/master-data-layout';

interface Product {
    id: string;
    name: string;
    slug: string;
    base_price: string | number;
}

interface ProductVariant {
    id: string;
    name: string;
    sku: string;
    price: string | number;
}

interface CartItem {
    id: string;
    product_id: string;
    product_variant_id: string | null;
    qty: number;
    price: number;
    subtotal: number;
    product: Product;
    variant?: ProductVariant | null;
}

interface Cart {
    id: string;
    customer_id: string | null;
    customer?: {
        id: string;
        name: string;
        email: string;
    } | null;
    total_price: number;
    total_qty: number;
    created_at: string;
    updated_at: string;
    items: CartItem[];
}

interface Props {
    cart: Cart;
}

export default function Show({ cart }: Props) {
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
    const [clearingCart, setClearingCart] = useState(false);

    const handleDeleteItem = () => {
        if (!deletingItemId) {
            return;
        }
        router.delete(
            `/dashboard/ecommerce/carts/${cart.id}/items/${deletingItemId}`,
            {
                onFinish: () => setDeletingItemId(null),
            },
        );
    };

    const handleClearCart = () => {
        router.delete(`/dashboard/ecommerce/carts/${cart.id}`, {
            onFinish: () => setClearingCart(false),
        });
    };

    return (
        <>
            <Head title={`Cart Details - ${cart.id.substring(0, 8)}`} />

            <div className="container mx-auto space-y-8 px-4 py-6">
                {/* NAVIGATION BACK */}
                <div>
                    <Link
                        href="/dashboard/ecommerce/carts"
                        className="flex w-fit items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                        &larr; Back to Carts List
                    </Link>
                </div>

                {/* HEADER INFO */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                                Cart Details
                            </h1>
                            <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-sm font-semibold text-foreground">
                                {cart.id}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Inspect items added by the customer and edit or
                            clear the cart status.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            onClick={() => setClearingCart(true)}
                            className="shadow-sm"
                        >
                            Delete Entire Cart
                        </Button>
                    </div>
                </div>

                <hr className="border-border" />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* CART ITEMS TABLE */}
                    <div className="space-y-4 lg:col-span-2">
                        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                            <div className="border-b px-5 py-4">
                                <h2 className="text-base font-bold text-foreground">
                                    Cart Items ({cart.items.length})
                                </h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b bg-muted/50 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                            <th className="px-5 py-3">
                                                Product Name
                                            </th>
                                            <th className="px-5 py-3 text-right">
                                                Unit Price
                                            </th>
                                            <th className="px-5 py-3 text-center">
                                                Quantity
                                            </th>
                                            <th className="px-5 py-3 text-right">
                                                Subtotal
                                            </th>
                                            <th className="px-5 py-3 text-center">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {cart.items.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="transition hover:bg-muted/50"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground">
                                                            {item.product.name}
                                                        </span>
                                                        {item.variant && (
                                                            <span className="mt-0.5 text-xs font-medium text-primary">
                                                                Variant:{' '}
                                                                {
                                                                    item.variant
                                                                        .name
                                                                }{' '}
                                                                (SKU:{' '}
                                                                {
                                                                    item.variant
                                                                        .sku
                                                                }
                                                                )
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-right font-medium text-foreground">
                                                    Rp{' '}
                                                    {Number(
                                                        item.price,
                                                    ).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-5 py-4 text-center font-semibold text-foreground">
                                                    {item.qty}
                                                </td>
                                                <td className="px-5 py-4 text-right font-bold text-foreground">
                                                    Rp{' '}
                                                    {Number(
                                                        item.subtotal,
                                                    ).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            setDeletingItemId(
                                                                item.id,
                                                            )
                                                        }
                                                        className="h-auto p-1.5 text-red-600 hover:bg-red-100 hover:text-red-800 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                                                    >
                                                        Remove
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* OWNER & SUMMARY PANEL */}
                    <div className="space-y-6">
                        {/* OWNER INFO CARD */}
                        <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
                            <h2 className="text-base font-bold text-foreground">
                                Cart Owner
                            </h2>
                            <hr className="border-border" />
                            {cart.customer ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Name
                                        </label>
                                        <p className="mt-0.5 text-sm font-semibold text-foreground">
                                            {cart.customer.name}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Email Address
                                        </label>
                                        <p className="mt-0.5 text-sm text-foreground">
                                            {cart.customer.email}
                                        </p>
                                    </div>
                                    <div className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                        Registered Account
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        This cart belongs to a guest user who
                                        has not signed in.
                                    </p>
                                    <div className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                                        Guest Session
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SUMMARY CALCULATIONS */}
                        <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
                            <h2 className="text-base font-bold text-foreground">
                                Potential Invoice
                            </h2>
                            <hr className="border-border" />
                            <div className="space-y-2.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Total Quantity
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {cart.total_qty} items
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Unique Products
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {cart.items.length} items
                                    </span>
                                </div>
                                <hr className="border-border" />
                                <div className="flex items-baseline justify-between pt-2">
                                    <span className="text-sm font-bold text-foreground">
                                        Total Value
                                    </span>
                                    <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                                        Rp{' '}
                                        {Number(
                                            cart.total_price,
                                        ).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* TIMESTAMPS */}
                        <div className="space-y-2.5 rounded-xl border bg-card p-5 text-xs text-muted-foreground shadow-sm">
                            <div className="flex justify-between">
                                <span>Created At:</span>
                                <span className="font-medium text-foreground">
                                    {new Date(cart.created_at).toLocaleString(
                                        'id-ID',
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Last Updated:</span>
                                <span className="font-medium text-foreground">
                                    {new Date(cart.updated_at).toLocaleString(
                                        'id-ID',
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DELETE SINGLE ITEM DIALOG */}
            <AlertDialog
                open={!!deletingItemId}
                onOpenChange={() => setDeletingItemId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Remove Item from Cart?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this item from the
                            shopping cart?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteItem}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Yes, Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* CLEAR CART DIALOG */}
            <AlertDialog open={clearingCart} onOpenChange={setClearingCart}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete Shopping Cart?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to clear and delete this
                            customer cart? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleClearCart}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
