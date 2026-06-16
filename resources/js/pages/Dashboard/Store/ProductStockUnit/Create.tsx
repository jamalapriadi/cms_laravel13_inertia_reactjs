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


export default function Create({ products }: Props) {
    const urlParams =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : null;
    const defaultProductId = urlParams?.get('product_id') || '';

    const { data, setData, transform, post, processing, errors } = useForm({
        product_id: defaultProductId,
        product_variant_id: '',
        imei_serial_number: '',
        barcode: '',
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
            product_variant_id: showVariantSelect
                ? formData.product_variant_id || null
                : null,
            barcode: formData.barcode || null,
            imei_serial_number: formData.imei_serial_number || null,
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
                            Tambahkan serial unit untuk produk.
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
                                placeholder="e.g., SN1234567890"
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
