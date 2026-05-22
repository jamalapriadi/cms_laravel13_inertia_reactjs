import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
// import AppLayout from '@/layouts/master-data-layout';

interface VariantOption {
    id: string;
    name: string;
    sku: string;
}

interface Props {
    variants: VariantOption[];
}

const networkOptions = [
    ['sim_free', 'SIM Free'],
    ['docomo', 'Docomo'],
    ['au', 'AU'],
    ['softbank', 'SoftBank'],
    ['rakuten', 'Rakuten'],
    ['mineo', 'Mineo'],
];

export default function Create({ variants }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        product_variant_id: '',
        imei_serial_number: '',
        network_compatibility: 'sim_free',
        status: 'available',
        note: '',
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        post('/dashboard/ecommerce/product-stock-units');
    };

    return (
        <>
            <Head title="Create Stok Unit" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/ecommerce/product-stock-units">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Create Stok Unit</h1>
                        <p className="text-sm text-muted-foreground">
                            Tambahkan IMEI/serial unit untuk product variant.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-xl border bg-card p-6 shadow-sm"
                >
                    <div className="space-y-2">
                        <Label>Product Variant</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={data.product_variant_id}
                            onChange={(e) =>
                                setData('product_variant_id', e.target.value)
                            }
                            required
                        >
                            <option value="">-- Select Variant --</option>
                            {variants.map((variant) => (
                                <option key={variant.id} value={variant.id}>
                                    {variant.name} ({variant.sku})
                                </option>
                            ))}
                        </select>
                        {errors.product_variant_id && (
                            <p className="text-xs text-destructive">
                                {errors.product_variant_id}
                            </p>
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

                    <div className="space-y-2">
                        <Label>Network</Label>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {networkOptions.map(([value, label]) => {
                                const selected =
                                    data.network_compatibility === value;

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
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                                    : 'border-red-500 bg-red-50 text-red-800'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
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

                    <div className="flex justify-end gap-3">
                        <Link href="/dashboard/ecommerce/product-stock-units">
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
