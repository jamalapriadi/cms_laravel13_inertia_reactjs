import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/master-data-layout';
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
        router.delete(`/dashboard/ecommerce/carts/${cart.id}/items/${deletingItemId}`, {
            onFinish: () => setDeletingItemId(null),
        });
    };

    const handleClearCart = () => {
        router.delete(`/dashboard/ecommerce/carts/${cart.id}`, {
            onFinish: () => setClearingCart(false),
        });
    };

    return (
        <AppLayout>
            <Head title={`Cart Details - ${cart.id.substring(0, 8)}`} />

            <div className="container mx-auto space-y-8 px-4 py-6">
                {/* NAVIGATION BACK */}
                <div>
                    <Link
                        href="/dashboard/ecommerce/carts"
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 w-fit"
                    >
                        &larr; Back to Carts List
                    </Link>
                </div>

                {/* HEADER INFO */}
                <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Cart Details</h1>
                            <span className="font-mono text-sm bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                                {cart.id}
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Inspect items added by the customer and edit or clear the cart status.
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

                <hr className="border-slate-100" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* CART ITEMS TABLE */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b">
                                <h2 className="font-bold text-base text-foreground">Cart Items ({cart.items.length})</h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            <th className="px-5 py-3">Product Name</th>
                                            <th className="px-5 py-3 text-right">Unit Price</th>
                                            <th className="px-5 py-3 text-center">Quantity</th>
                                            <th className="px-5 py-3 text-right">Subtotal</th>
                                            <th className="px-5 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {cart.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground">
                                                            {item.product.name}
                                                        </span>
                                                        {item.variant && (
                                                            <span className="text-xs text-primary font-medium mt-0.5">
                                                                Variant: {item.variant.name} (SKU: {item.variant.sku})
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-right font-medium text-foreground">
                                                    Rp {Number(item.price).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-5 py-4 text-center font-semibold text-slate-700">
                                                    {item.qty}
                                                </td>
                                                <td className="px-5 py-4 text-right font-bold text-foreground">
                                                    Rp {Number(item.subtotal).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setDeletingItemId(item.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 h-auto"
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
                        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                            <h2 className="font-bold text-base text-foreground">Cart Owner</h2>
                            <hr className="border-slate-100" />
                            {cart.user ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                            Name
                                        </label>
                                        <p className="text-sm font-semibold text-foreground mt-0.5">
                                            {cart.user.name}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                            Email Address
                                        </label>
                                        <p className="text-sm text-foreground mt-0.5">
                                            {cart.user.email}
                                        </p>
                                    </div>
                                    <div className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                        Registered Account
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        This cart belongs to a guest user who has not signed in.
                                    </p>
                                    <div className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                        Guest Session
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SUMMARY CALCULATIONS */}
                        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                            <h2 className="font-bold text-base text-foreground">Potential Invoice</h2>
                            <hr className="border-slate-100" />
                            <div className="space-y-2.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total Quantity</span>
                                    <span className="font-semibold text-foreground">{cart.total_qty} items</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Unique Products</span>
                                    <span className="font-semibold text-foreground">{cart.items.length} items</span>
                                </div>
                                <hr className="border-slate-100" />
                                <div className="flex justify-between items-baseline pt-2">
                                    <span className="font-bold text-sm text-foreground">Total Value</span>
                                    <span className="text-xl font-extrabold text-emerald-600">
                                        Rp {Number(cart.total_price).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* TIMESTAMPS */}
                        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2.5 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Created At:</span>
                                <span className="font-medium text-foreground">
                                    {new Date(cart.created_at).toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Last Updated:</span>
                                <span className="font-medium text-foreground">
                                    {new Date(cart.updated_at).toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DELETE SINGLE ITEM DIALOG */}
            <AlertDialog open={!!deletingItemId} onOpenChange={() => setDeletingItemId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Item from Cart?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this item from the shopping cart?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteItem} className="bg-red-600 hover:bg-red-700 text-white">
                            Yes, Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* CLEAR CART DIALOG */}
            <AlertDialog open={clearingCart} onOpenChange={setClearingCart}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Shopping Cart?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to clear and delete this customer cart? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearCart} className="bg-red-600 hover:bg-red-700 text-white">
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
