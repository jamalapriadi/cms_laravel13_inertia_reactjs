import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

import SearchableSelect from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';

interface VariantItem {
    id: string;
    name: string;
    sku: string;
}

interface Product {
    id: string;
    name: string;
    has_variant: boolean;
    sku?: string | null;
    variant_items: VariantItem[];
}

interface Props {
    products: Product[];
}

const networkOptions = [
    ['sim_free', 'All Operator'],
    ['docomo', 'Docomo'],
    ['au', 'AU'],
    ['softbank', 'SoftBank'],
    ['rakuten', 'Rakuten'],
    ['mineo', 'Mineo'],
];

export default function Create({ products }: Props) {
    const urlParams =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : null;
    const defaultProductId = urlParams?.get('product_id') || '';

    const [hasNetwork, setHasNetwork] = useState(false);
    const { data, setData, transform, post, processing, errors } = useForm({
        product_id: defaultProductId,
        product_variant_id: '',
        imei_serial_number: '',
        barcode: '',
        battery_health: '',
        grade: '',
        network_compatibility: null as string | null,
        status: 'available',
        note: '',
    });

    const selectedProduct = products.find((p) => p.id === data.product_id);
    const showVariantSelect = selectedProduct?.has_variant ?? false;

    // Reset variant item if selected product has no variants
    useEffect(() => {
        if (selectedProduct && !selectedProduct.has_variant) {
            setData('product_variant_id', '');
        }
    }, [selectedProduct, setData]);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        transform((formData) => ({
            ...formData,
            network_compatibility: hasNetwork
                ? formData.network_compatibility || 'sim_free'
                : null,
            product_variant_id: showVariantSelect
                ? formData.product_variant_id || null
                : null,
            barcode: formData.barcode || null,
            battery_health:
                formData.battery_health === '' ||
                formData.battery_health === null
                    ? null
                    : Number(formData.battery_health),
            grade: formData.grade || null,
        }));
        post('/my-admin/dashboard/ecommerce/product-stock-units');
    };

    return (
        <>
            <Head title="Create Stok Unit" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex items-center gap-4">
                    <Link href="/my-admin/dashboard/ecommerce/product-stock-units">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Create Stok Unit</h1>
                        <p className="text-sm text-muted-foreground">
                            Tambahkan IMEI/serial unit untuk produk.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-xl border bg-card p-6 shadow-sm"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Product</Label>
                            <SearchableSelect
                                options={products.map((product) => ({
                                    value: product.id,
                                    label: product.name,
                                }))}
                                value={data.product_id}
                                onChange={(value) =>
                                    setData('product_id', value ?? '')
                                }
                                placeholder="-- Select Product --"
                                error={errors.product_id}
                            />
                            {selectedProduct &&
                                !selectedProduct.has_variant && (
                                    <p className="text-xs text-muted-foreground">
                                        SKU produk: {selectedProduct.sku || '-'}
                                    </p>
                                )}
                        </div>

                        {showVariantSelect && (
                            <div className="space-y-2">
                                <Label>Product Variant Item</Label>
                                <SearchableSelect
                                    options={(
                                        selectedProduct?.variant_items ?? []
                                    ).map((variant) => ({
                                        value: variant.id,
                                        label: variant.name,
                                        description: variant.sku,
                                    }))}
                                    value={data.product_variant_id}
                                    onChange={(value) =>
                                        setData(
                                            'product_variant_id',
                                            value ?? '',
                                        )
                                    }
                                    placeholder="-- Select Variant Item --"
                                    error={errors.product_variant_id}
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>IMEI / Serial Number</Label>
                            <Input
                                value={data.imei_serial_number}
                                onChange={(e) =>
                                    setData(
                                        'imei_serial_number',
                                        e.target.value,
                                    )
                                }
                                placeholder="e.g., 351234567890123"
                                required
                            />
                            {errors.imei_serial_number && (
                                <p className="text-xs text-destructive">
                                    {errors.imei_serial_number}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Barcode</Label>
                            <Input
                                value={data.barcode}
                                onChange={(e) =>
                                    setData('barcode', e.target.value)
                                }
                                placeholder="Optional barcode"
                            />
                            {errors.barcode && (
                                <p className="text-xs text-destructive">
                                    {errors.barcode}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Battery Health (%)</Label>
                            <Input
                                type="number"
                                min={0}
                                max={100}
                                value={data.battery_health}
                                onChange={(e) =>
                                    setData('battery_health', e.target.value)
                                }
                                placeholder="Optional, 0-100"
                            />
                            {errors.battery_health && (
                                <p className="text-xs text-destructive">
                                    {errors.battery_health}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Grade</Label>
                            <Input
                                value={data.grade}
                                onChange={(e) =>
                                    setData('grade', e.target.value)
                                }
                                placeholder="Optional, e.g., A / B+ / C"
                                maxLength={50}
                            />
                            {errors.grade && (
                                <p className="text-xs text-destructive">
                                    {errors.grade}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={data.status}
                                onChange={(e) =>
                                    setData('status', e.target.value)
                                }
                            >
                                <option value="available">Available</option>
                                <option value="reserved">Reserved</option>
                                <option value="sold">Sold</option>
                                <option value="damaged">Damaged</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-medium">
                            <Checkbox
                                checked={hasNetwork}
                                onCheckedChange={(checked) => {
                                    const enabled = checked === true;

                                    setHasNetwork(enabled);
                                    setData(
                                        'network_compatibility',
                                        enabled
                                            ? data.network_compatibility ||
                                                  'sim_free'
                                            : null,
                                    );
                                }}
                            />
                            Ada network
                        </label>

                        {hasNetwork && (
                            <div className="space-y-2">
                                <Label>Network</Label>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {networkOptions.map(([value, label]) => {
                                        const selected =
                                            data.network_compatibility ===
                                            value;

                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() =>
                                                    setData(
                                                        'network_compatibility',
                                                        value,
                                                    )
                                                }
                                                className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                                                    selected
                                                        ? value === 'sim_free'
                                                            ? 'border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                            : 'border-red-500 bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                                                        : 'border-border bg-card text-muted-foreground hover:border-border'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {errors.network_compatibility && (
                            <p className="text-xs text-destructive">
                                {errors.network_compatibility}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Note</Label>
                        <Textarea
                            rows={3}
                            value={data.note}
                            onChange={(e) => setData('note', e.target.value)}
                            placeholder="Optional internal note..."
                        />
                    </div>

                    <div className="flex justify-between gap-3">
                        <Link href="/my-admin/dashboard/ecommerce/product-stock-units">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            Save Stok Unit
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
