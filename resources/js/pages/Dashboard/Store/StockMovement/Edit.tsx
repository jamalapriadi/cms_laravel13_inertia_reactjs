import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/master-data-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import { ArrowLeft, Warehouse, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

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

    const selectedVariant = variants.find((v) => v.id === data.product_variant_id);
    const currentStock = selectedVariant ? selectedVariant.stock : 0;

    // Calculate base stock (current variant stock reversed of the old movement effect)
    let oldStockEffect = 0;
    if (selectedVariant && selectedVariant.id === movement.product_variant_id) {
        if (inGroup(movement.type, ['purchase', 'return', 'cancel'])) {
            oldStockEffect = movement.qty;
        } else if (movement.type === 'sale') {
            oldStockEffect = -movement.qty;
        } else { // adjustment
            oldStockEffect = movement.qty; // already has correct sign
        }
    }
    const baseStock = currentStock - oldStockEffect;

    // Calculate new stock changes
    let stockChange = 0;
    const qtyVal = Number(data.qty) || 0;

    if (data.type === 'purchase' || data.type === 'return' || data.type === 'cancel') {
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
        <AppLayout>
            <Head title="Edit Stock Movement" />

            <div className="container mx-auto max-w-4xl space-y-8 px-6 py-8">
                {/* HEADER */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/ecommerce/stock-movements">
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Stock Movement</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Update details of an existing movement. Saving will recalculate variant stock levels.
                        </p>
                    </div>
                </div>

                <hr className="border-border" />

                <div className="grid gap-6 md:grid-cols-3">
                    {/* FORM CONTAINER */}
                    <div className="md:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Variant Selector */}
                            <div className="space-y-2">
                                <Label htmlFor="product_variant_id">Product Variant</Label>
                                <select
                                    id="product_variant_id"
                                    value={data.product_variant_id}
                                    onChange={(e) => setData('product_variant_id', e.target.value)}
                                    className="flex w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    required
                                >
                                    {variants.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.sku} | {v.name} (Current stock: {v.stock})
                                        </option>
                                    ))}
                                </select>
                                {errors.product_variant_id && (
                                    <p className="text-xs font-semibold text-red-500 mt-1">{errors.product_variant_id}</p>
                                )}
                            </div>

                            {/* Grid fields for type & qty */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Movement Type</Label>
                                    <select
                                        id="type"
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value)}
                                        className="flex w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        required
                                    >
                                        <option value="purchase">Purchase (Inward)</option>
                                        <option value="sale">Sale (Outward)</option>
                                        <option value="adjustment">Stock Adjustment</option>
                                        <option value="return">Return (Inward)</option>
                                        <option value="cancel">Cancel (Inward)</option>
                                    </select>
                                    {errors.type && (
                                        <p className="text-xs font-semibold text-red-500 mt-1">{errors.type}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="qty">Quantity</Label>
                                    <Input
                                        id="qty"
                                        type="number"
                                        min="1"
                                        value={data.qty}
                                        onChange={(e) => setData('qty', parseInt(e.target.value) || 0)}
                                        required
                                    />
                                    {errors.qty && (
                                        <p className="text-xs font-semibold text-red-500 mt-1">{errors.qty}</p>
                                    )}
                                </div>
                            </div>

                            {/* Adjustment action if type = adjustment */}
                            {data.type === 'adjustment' && (
                                <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/30 p-4">
                                    <Label htmlFor="adjustment_action" className="text-amber-800 font-bold">Adjustment Action</Label>
                                    <select
                                        id="adjustment_action"
                                        value={data.adjustment_action}
                                        onChange={(e) => setData('adjustment_action', e.target.value as 'add' | 'subtract')}
                                        className="flex w-full h-10 rounded-md border border-amber-300 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                    >
                                        <option value="add">Add Stock (+)</option>
                                        <option value="subtract">Deduct Stock (-)</option>
                                    </select>
                                </div>
                            )}

                            {/* Note */}
                            <div className="space-y-2">
                                <Label htmlFor="note">Notes / Explanation</Label>
                                <Textarea
                                    id="note"
                                    placeholder="Enter reasoning or order number for reference..."
                                    value={data.note}
                                    onChange={(e) => setData('note', e.target.value)}
                                    rows={3}
                                />
                                {errors.note && (
                                    <p className="text-xs font-semibold text-red-500 mt-1">{errors.note}</p>
                                )}
                            </div>

                            {/* Submit button */}
                            <div className="flex gap-3 justify-end">
                                <Link href="/dashboard/ecommerce/stock-movements">
                                    <Button variant="outline" type="button">Cancel</Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* LIVE PREVIEW WIDGET */}
                    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-6 h-fit">
                        <h3 className="font-bold text-foreground flex items-center gap-1.5 border-b pb-3 border-border">
                            <Warehouse className="w-4 h-4 text-primary" />
                            Stock Correction preview
                        </h3>

                        {selectedVariant ? (
                            <div className="space-y-5">
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</span>
                                    <p className="text-sm font-bold text-foreground truncate">{selectedVariant.name}</p>
                                    <p className="text-xs text-muted-foreground font-mono">SKU: {selectedVariant.sku}</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Current Stock (w/ old movement):</span>
                                        <span className="font-semibold text-foreground">{currentStock}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Reverted Base Stock:</span>
                                        <span className="font-semibold text-foreground">{baseStock}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-t pt-2">
                                        <span className="text-muted-foreground">Proposed Change:</span>
                                        <span className={`font-semibold flex items-center gap-0.5 ${
                                            stockChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                        }`}>
                                            {stockChange >= 0 ? '+' : ''}{stockChange}
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
                                    <span className="text-xs font-bold text-primary uppercase">Estimated Stock After</span>
                                    <p className="text-3xl font-extrabold mt-1.5 text-primary">{projectedStock}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">This will update the variant's stock immediately.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                Select a product variant to preview simulated stock updates.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
