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

interface Props {
    variants: VariantOption[];
}

export default function Create({ variants }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        product_variant_id: '',
        type: 'purchase',
        qty: 1,
        adjustment_action: 'add',
        note: '',
    });

    const selectedVariant = variants.find(
        (v) => v.id === data.product_variant_id,
    );
    const currentStock = selectedVariant ? selectedVariant.stock : 0;

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

    const projectedStock = currentStock + stockChange;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/dashboard/ecommerce/stock-movements');
    };

    return (
        <>
            <Head title="Add Stock Movement" />

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
                            Add Stock Movement
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Log a new inventory transaction and adjust stock
                            levels.
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
                                    <option value="">
                                        -- Select Product Variant --
                                    </option>
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
                                                e.target.value,
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
                                    <p className="mt-1 text-xs text-amber-600">
                                        Choose whether this adjustment increases
                                        or decreases the stock levels.
                                    </p>
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
                                <Button
                                    type="submit"
                                    disabled={
                                        processing || !data.product_variant_id
                                    }
                                >
                                    Save Movement
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* LIVE PREVIEW WIDGET */}
                    <div className="h-fit space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm">
                        <h3 className="flex items-center gap-1.5 border-b border-border pb-3 font-bold text-foreground">
                            <Warehouse className="h-4 w-4 text-primary" />
                            Live Stock Estimator
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-lg border bg-slate-50 p-3 text-center dark:bg-slate-900/40">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                            Current Stock
                                        </span>
                                        <p className="mt-1 text-xl font-bold text-foreground">
                                            {currentStock}
                                        </p>
                                    </div>

                                    <div
                                        className={`rounded-lg border p-3 text-center ${
                                            stockChange >= 0
                                                ? 'border-emerald-100 bg-emerald-50/50'
                                                : 'border-rose-100 bg-rose-50/50'
                                        }`}
                                    >
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                            Stock Change
                                        </span>
                                        <p
                                            className={`mt-1 flex items-center justify-center gap-0.5 text-xl font-extrabold ${
                                                stockChange >= 0
                                                    ? 'text-emerald-600'
                                                    : 'text-rose-600'
                                            }`}
                                        >
                                            {stockChange >= 0 ? (
                                                <ArrowUpRight className="h-4 w-4" />
                                            ) : (
                                                <ArrowDownLeft className="h-4 w-4" />
                                            )}
                                            {stockChange >= 0
                                                ? `+${stockChange}`
                                                : stockChange}
                                        </p>
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
                                Select a product variant on the left to preview
                                simulated stock updates in real-time.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
