import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowDownLeft,
    ArrowLeft,
    ArrowUpRight,
    Warehouse,
} from 'lucide-react';

import SearchableSelect from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';

interface VariantOption {
    id: string;
    name: string;
    sku: string;
    stock: number;
    stock_units: StockUnitOption[];
}

interface StockUnitOption {
    id: string;
    imei_serial_number: string;
    network_compatibility: string | null;
    status: 'available' | 'reserved' | 'sold' | 'damaged';
}

interface Props {
    variants: VariantOption[];
}

export default function Create({ variants }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        product_variant_id: '',
        product_stock_unit_id: '',
        type: 'purchase',
        qty: 1,
        adjustment_action: 'add',
        note: '',
    });

    const selectedVariant = variants.find(
        (v) => v.id === data.product_variant_id,
    );
    const selectedStockUnit = selectedVariant?.stock_units.find(
        (unit) => unit.id === data.product_stock_unit_id,
    );
    const currentStock = selectedVariant ? selectedVariant.stock : 0;

    const statusAfterMovement = () => {
        if (data.type === 'sale') {
            return 'sold';
        }

        if (data.type === 'adjustment') {
            return data.adjustment_action === 'subtract'
                ? 'damaged'
                : 'available';
        }

        return 'available';
    };

    const nextStatus = statusAfterMovement();
    const stockChange = selectedStockUnit
        ? (nextStatus === 'available' ? 1 : 0) -
          (selectedStockUnit.status === 'available' ? 1 : 0)
        : 0;

    const projectedStock = currentStock + stockChange;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/my-admin/dashboard/ecommerce/stock-movements');
    };

    return (
        <>
            <Head title="Add Stock Movement" />

            <div className="container mx-auto max-w-4xl space-y-8 px-6 py-8">
                {/* HEADER */}
                <div className="flex items-center gap-4">
                    <Link href="/my-admin/dashboard/ecommerce/stock-movements">
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
                                <SearchableSelect
                                    options={variants.map((v) => ({
                                        value: v.id,
                                        label: `${v.sku} | ${v.name}`,
                                        description: `Current stock: ${v.stock}`,
                                    }))}
                                    value={data.product_variant_id}
                                    onChange={(value) =>
                                        setData({
                                            ...data,
                                            product_variant_id: value ?? '',
                                            product_stock_unit_id: '',
                                        })
                                    }
                                    placeholder="-- Select Product Variant --"
                                    error={errors.product_variant_id}
                                />
                            </div>

                            {/* Stock Unit Selector */}
                            <div className="space-y-2">
                                <Label htmlFor="product_stock_unit_id">
                                    Stock Unit / IMEI
                                </Label>
                                <SearchableSelect
                                    options={(
                                        selectedVariant?.stock_units ?? []
                                    ).map((unit) => ({
                                        value: unit.id,
                                        label: unit.imei_serial_number,
                                        description: `${unit.network_compatibility ?? '-'} | ${unit.status}`,
                                    }))}
                                    value={data.product_stock_unit_id}
                                    onChange={(value) =>
                                        setData(
                                            'product_stock_unit_id',
                                            value ?? '',
                                        )
                                    }
                                    disabled={!selectedVariant}
                                    placeholder="-- Select Stock Unit --"
                                    error={errors.product_stock_unit_id}
                                />
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
                                        value={1}
                                        disabled
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        One stock movement applies to one IMEI
                                        unit.
                                    </p>
                                </div>
                            </div>

                            {/* Adjustment action if type = adjustment */}
                            {data.type === 'adjustment' && (
                                <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-100/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
                                    <Label
                                        htmlFor="adjustment_action"
                                        className="font-bold text-amber-800 dark:text-amber-300"
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
                                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
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
                            <div className="flex justify-between gap-3">
                                <Link href="/my-admin/dashboard/ecommerce/stock-movements">
                                    <Button variant="outline" type="button">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        !data.product_variant_id ||
                                        !data.product_stock_unit_id
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

                                {selectedStockUnit && (
                                    <div className="rounded-lg border bg-muted/50 p-3 text-xs dark:bg-muted/40">
                                        <span className="font-semibold text-muted-foreground uppercase">
                                            Selected IMEI
                                        </span>
                                        <p className="mt-1 font-mono font-bold">
                                            {
                                                selectedStockUnit.imei_serial_number
                                            }
                                        </p>
                                        <p className="mt-1 text-muted-foreground">
                                            {selectedStockUnit.status} →{' '}
                                            {nextStatus}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-lg border bg-muted/50 p-3 text-center dark:bg-muted/40">
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
                                                ? 'border-emerald-200 bg-emerald-100/70 dark:border-emerald-900/60 dark:bg-emerald-950/30'
                                                : 'border-rose-200 bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40'
                                        }`}
                                    >
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                            Stock Change
                                        </span>
                                        <p
                                            className={`mt-1 flex items-center justify-center gap-0.5 text-xl font-extrabold ${
                                                stockChange >= 0
                                                    ? 'text-emerald-700 dark:text-emerald-300'
                                                    : 'text-rose-700 dark:text-rose-300'
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
                                        This is calculated from the selected
                                        stock unit status.
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
