import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

import SearchableSelect from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';

interface ProductStockUnit {
    id: string;
    product_id: string;
    product_variant_id: string | null;
    imei_serial_number: string;
    barcode?: string | null;
    battery_health?: number | null;
    grade?: string | null;
    network_compatibility: string | null;
    status: 'available' | 'reserved' | 'sold' | 'damaged';
    note?: string | null;
    variant?: {
        id: string;
        product_id: string;
    } | null;
}

interface VariantItem {
    id: string;
    name: string;
    sku: string;
}

interface Product {
    id: string;
    name: string;
    has_variant: boolean;
    variant_items: VariantItem[];
}

interface Props {
    stockUnit: ProductStockUnit;
    products: Product[];
}

export default function Edit({ stockUnit, products }: Props) {
    const { data, setData, transform, put, processing, errors } = useForm({
        product_id: stockUnit.product_id || stockUnit.variant?.product_id || '',
        product_variant_id: stockUnit.product_variant_id || '',
        imei_serial_number: stockUnit.imei_serial_number || '',
        barcode: stockUnit.barcode || '',
        status: stockUnit.status,
        note: stockUnit.note || '',
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
            product_variant_id: showVariantSelect
                ? formData.product_variant_id || null
                : null,
            barcode: formData.barcode || null,
            imei_serial_number: formData.imei_serial_number || null,
        }));
        put(
            `/my-admin/dashboard/ecommerce/product-stock-units/${stockUnit.id}`,
        );
    };

    return (
        <>
            <Head title="Edit Stok Unit" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex items-center gap-4">
                    <Link href="/my-admin/dashboard/ecommerce/product-stock-units">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Edit Stok Unit</h1>
                        <p className="text-sm text-muted-foreground">
                            Update serial unit dan status stok.
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

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Serial Number</Label>
                            <Input
                                value={data.imei_serial_number}
                                onChange={(e) =>
                                    setData(
                                        'imei_serial_number',
                                        e.target.value,
                                    )
                                }
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
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={data.status}
                                onChange={(e) =>
                                    setData(
                                        'status',
                                        e.target
                                            .value as ProductStockUnit['status'],
                                    )
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
                        <Label>Note</Label>
                        <Textarea
                            rows={3}
                            value={data.note}
                            onChange={(e) => setData('note', e.target.value)}
                        />
                    </div>

                    <div className="flex justify-between gap-3">
                        <Link href="/my-admin/dashboard/ecommerce/product-stock-units">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            Update Stok Unit
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
