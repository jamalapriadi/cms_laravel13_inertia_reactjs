import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/master-data-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import {
    ArrowLeft,
    Warehouse,
    ArrowUpRight,
    ArrowDownLeft,
} from 'lucide-react';

interface VariantOption {
    id: string;
    name: string;
    sku: string;
    stock: number;
}

interface StockMovement {
    id: string;
    product_variant_id: string;
    type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'cancel';
    qty: number;
    stock_before: number;
    stock_after: number;
    note: string | null;
}

interface Props {
    movement: StockMovement;
    variants: VariantOption[];
    adjustment_action: 'add' | 'subtract';
}

export default function Edit({ movement, variants, adjustment_action }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        product_variant_id: movement.product_variant_id,
        type: movement.type,
        qty: Math.abs(movement.qty), // ensure positive in form input
        adjustment_action: adjustment_action,
        note: movement.note || '',
    });

    const selectedVariant = variants.find(
        (v) => v.id === data.product_variant_id,
    );
    const currentStock = selectedVariant ? selectedVariant.stock : 0;

    // Calculate base stock (current variant stock reversed of the old movement effect)
    let oldStockEffect = 0;
    if (selectedVariant && selectedVariant.id === movement.product_variant_id) {
        if (inGroup(movement.type, ['purchase', 'return', 'cancel'])) {
            oldStockEffect = movement.qty;
        } else if (movement.type === 'sale') {
            oldStockEffect = -movement.qty;
        } else {
            // adjustment
            oldStockEffect = movement.qty; // already has correct sign
        }
    }
    const baseStock = currentStock - oldStockEffect;

    // Calculate new stock changes
    let stockChange = 0;
    const qtyVal = Number(data.qty) || 0;

    if (
        data.type === 'purchase' ||
        data.type === 'return' ||
        data.type === 'cancel'
    ) {
        stockChange = qtyVal;
    } else if (data.type === 'sale') {
        stockChange = -qtyVal;
    } else if (data.type === 'adjustment') {
        stockChange = data.adjustment_action === 'subtract' ? -qtyVal : qtyVal;
    }

    const projectedStock = baseStock + stockChange;

    function inGroup(val: string, group: string[]) {
        return group.indexOf(val) !== -1;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/dashboard/ecommerce/stock-movements/${movement.id}`);
    };

    return (
        <>
            <Head title="Edit Stock Movement" />

            <div className="container mx-auto max-w-4xl space-y-8 px-6 py-8">
                {/* HEADER */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/ecommerce/stock-movements">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Edit Stock Movement
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Update details of an existing movement. Saving will
                            recalculate variant stock levels.
                        </p>
                    </div>
                </div>

                <hr className="border-border" />

                <div className="grid gap-6 md:grid-cols-3">
                    {/* FORM CONTAINER */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:col-span-2">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Variant Selector */}
                            <div className="space-y-2">
                                <Label htmlFor="product_variant_id">
                                    Product Variant
                                </Label>
                                <select
                                    id="product_variant_id"
                                    value={data.product_variant_id}
                                    onChange={(e) =>
                                        setData(
                                            'product_variant_id',
                                            e.target.value,
                                        )
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                    required
                                >
                                    {variants.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.sku} | {v.name} (Current stock:{' '}
                                            {v.stock})
                                        </option>
                                    ))}
                                </select>
                                {errors.product_variant_id && (
                                    <p className="mt-1 text-xs font-semibold text-red-500">
                                        {errors.product_variant_id}
                                    </p>
                                )}
                            </div>

                            {/* Grid fields for type & qty */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Movement Type</Label>
                                    <select
                                        id="type"
                                        value={data.type}
                                        onChange={(e) =>
                                            setData('type', e.target.value)
                                        }
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                        required
                                    >
                                        <option value="purchase">
                                            Purchase (Inward)
                                        </option>
                                        <option value="sale">
                                            Sale (Outward)
                                        </option>
                                        <option value="adjustment">
                                            Stock Adjustment
                                        </option>
                                        <option value="return">
                                            Return (Inward)
                                        </option>
                                        <option value="cancel">
                                            Cancel (Inward)
                                        </option>
                                    </select>
                                    {errors.type && (
                                        <p className="mt-1 text-xs font-semibold text-red-500">
                                            {errors.type}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="qty">Quantity</Label>
                                    <Input
                                        id="qty"
                                        type="number"
                                        min="1"
                                        value={data.qty}
                                        onChange={(e) =>
                                            setData(
                                                'qty',
                                                parseInt(e.target.value) || 0,
                                            )
                                        }
                                        required
                                    />
                                    {errors.qty && (
                                        <p className="mt-1 text-xs font-semibold text-red-500">
                                            {errors.qty}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Adjustment action if type = adjustment */}
                            {data.type === 'adjustment' && (
                                <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/30 p-4">
                                    <Label
                                        htmlFor="adjustment_action"
                                        className="font-bold text-amber-800"
                                    >
                                        Adjustment Action
                                    </Label>
                                    <select
                                        id="adjustment_action"
                                        value={data.adjustment_action}
                                        onChange={(e) =>
                                            setData(
                                                'adjustment_action',
                                                e.target.value as
                                                    | 'add'
                                                    | 'subtract',
                                            )
                                        }
                                        className="flex h-10 w-full rounded-md border border-amber-300 bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                                    >
                                        <option value="add">
                                            Add Stock (+)
                                        </option>
                                        <option value="subtract">
                                            Deduct Stock (-)
                                        </option>
                                    </select>
                                </div>
                            )}

                            {/* Note */}
                            <div className="space-y-2">
                                <Label htmlFor="note">
                                    Notes / Explanation
                                </Label>
                                <Textarea
                                    id="note"
                                    placeholder="Enter reasoning or order number for reference..."
                                    value={data.note}
                                    onChange={(e) =>
                                        setData('note', e.target.value)
                                    }
                                    rows={3}
                                />
                                {errors.note && (
                                    <p className="mt-1 text-xs font-semibold text-red-500">
                                        {errors.note}
                                    </p>
                                )}
                            </div>

                            {/* Submit button */}
                            <div className="flex justify-end gap-3">
                                <Link href="/dashboard/ecommerce/stock-movements">
                                    <Button variant="outline" type="button">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* LIVE PREVIEW WIDGET */}
                    <div className="h-fit space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm">
                        <h3 className="flex items-center gap-1.5 border-b border-border pb-3 font-bold text-foreground">
                            <Warehouse className="h-4 w-4 text-primary" />
                            Stock Correction preview
                        </h3>

                        {selectedVariant ? (
                            <div className="space-y-5">
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        Product
                                    </span>
                                    <p className="truncate text-sm font-bold text-foreground">
                                        {selectedVariant.name}
                                    </p>
                                    <p className="font-mono text-xs text-muted-foreground">
                                        SKU: {selectedVariant.sku}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">
                                            Current Stock (w/ old movement):
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {currentStock}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">
                                            Reverted Base Stock:
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {baseStock}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-t pt-2 text-xs">
                                        <span className="text-muted-foreground">
                                            Proposed Change:
                                        </span>
                                        <span
                                            className={`flex items-center gap-0.5 font-semibold ${
                                                stockChange >= 0
                                                    ? 'text-emerald-600'
                                                    : 'text-rose-600'
                                            }`}
                                        >
                                            {stockChange >= 0 ? '+' : ''}
                                            {stockChange}
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                                    <span className="text-xs font-bold text-primary uppercase">
                                        Estimated Stock After
                                    </span>
                                    <p className="mt-1.5 text-3xl font-extrabold text-primary">
                                        {projectedStock}
                                    </p>
                                    <p className="mt-1 text-[10px] text-muted-foreground">
                                        This will update the variant's stock
                                        immediately.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                Select a product variant to preview simulated
                                stock updates.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
