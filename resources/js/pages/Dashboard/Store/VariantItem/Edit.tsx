import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

import MediaImagePicker from '@/components/media/MediaImagePicker';
import SearchableSelect from '@/components/SearchableSelect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/master-data-layout';

interface ProductVariantOption {
    id: string;
    value: string;
}

interface ProductVariant {
    id: string;
    name: string;
    options?: ProductVariantOption[];
}

interface VariantItem {
    id: string;
    product_id: string;
    unit_id?: string | null;
    sku: string;
    name: string;
    image?: string | null;
    buying_price: string | number;
    selling_price: string | number;
    track_stock: boolean;
    stock: number;
    min_stock_alert?: number | null;
    weight?: string | number | null;
    is_active: boolean;
    options?: ProductVariantOption[];
}

interface Unit {
    id: string;
    name: string;
    code: string;
}

interface Props {
    variantItem: VariantItem;
    units: Unit[];
    productOptions: ProductVariant[];
}

export default function Edit({ variantItem, units, productOptions }: Props) {
    const [form, setForm] = useState({
        product_id: variantItem.product_id,
        unit_id: variantItem.unit_id ?? '',
        sku: variantItem.sku,
        name: variantItem.name,
        image: variantItem.image ?? null,
        buying_price: Number(variantItem.buying_price ?? 0),
        selling_price: Number(variantItem.selling_price ?? 0),
        track_stock: Boolean(variantItem.track_stock),
        stock: Number(variantItem.stock ?? 0),
        min_stock_alert: variantItem.min_stock_alert ?? null,
        weight: variantItem.weight != null ? Number(variantItem.weight) : null,
        is_active: Boolean(variantItem.is_active),
        option_ids: (variantItem.options ?? []).map((option) => option.id),
    });
    const [processing, setProcessing] = useState(false);

    const toggleOption = (optionId: string) => {
        setForm((current) => ({
            ...current,
            option_ids: current.option_ids.includes(optionId)
                ? current.option_ids.filter((id) => id !== optionId)
                : [...current.option_ids, optionId],
        }));
    };

    const submit = () => {
        router.put(
            `/my-admin/dashboard/ecommerce/variant-items/${variantItem.id}`,
            form,
            {
                preserveScroll: true,
                onStart: () => {
                    setProcessing(true);
                    toast.loading('Updating variant item...', {
                        id: 'variant-item',
                    });
                },
                onSuccess: () => {
                    toast.success('Variant item updated successfully.', {
                        id: 'variant-item',
                    });
                },
                onError: () => {
                    toast.error('Please check the variant item data.', {
                        id: 'variant-item',
                    });
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Edit Variant Item" />

            <div className="container mx-auto space-y-8 px-6 py-10">
                <div>
                    <h1 className="text-2xl font-bold">Edit Variant Item</h1>
                    <p className="text-muted-foreground">
                        Update SKU, price, stock, image, and variant options.
                    </p>
                </div>

                <div className="space-y-6 rounded-lg bg-card p-6 shadow">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label>Variant Item Name</Label>
                            <Input
                                value={form.name}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>SKU</Label>
                            <Input
                                value={form.sku}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        sku: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Unit Optional</Label>
                            <SearchableSelect
                                options={units.map((unit) => ({
                                    value: unit.id,
                                    label: unit.name,
                                    description: unit.code,
                                }))}
                                value={form.unit_id}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        unit_id: value ?? '',
                                    }))
                                }
                                placeholder="-- No Unit --"
                                clearable
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Image</Label>
                            <MediaImagePicker
                                value={form.image}
                                onChange={(path) =>
                                    setForm((current) => ({
                                        ...current,
                                        image: path,
                                    }))
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Buying Price</Label>
                            <Input
                                type="number"
                                min="0"
                                value={form.buying_price}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        buying_price: Number(
                                            event.target.value,
                                        ),
                                    }))
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Selling Price</Label>
                            <Input
                                type="number"
                                min="0"
                                value={form.selling_price}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        selling_price: Number(
                                            event.target.value,
                                        ),
                                    }))
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Stock</Label>
                            <Input
                                type="number"
                                min="0"
                                value={form.stock}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        stock: Number(event.target.value),
                                    }))
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Weight</Label>
                            <Input
                                type="number"
                                min="0"
                                value={form.weight ?? ''}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        weight: event.target.value
                                            ? Number(event.target.value)
                                            : null,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Variant Options</Label>
                        <div className="grid gap-4 md:grid-cols-2">
                            {productOptions.map((variant) => (
                                <div
                                    key={variant.id}
                                    className="space-y-2 rounded-lg border bg-background p-4"
                                >
                                    <p className="text-sm font-semibold">
                                        {variant.name}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {(variant.options ?? []).map(
                                            (option) => {
                                                const selected =
                                                    form.option_ids.includes(
                                                        option.id,
                                                    );

                                                return (
                                                    <button
                                                        type="button"
                                                        key={option.id}
                                                        onClick={() =>
                                                            toggleOption(
                                                                option.id,
                                                            )
                                                        }
                                                    >
                                                        <Badge
                                                            variant={
                                                                selected
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {option.value}
                                                        </Badge>
                                                    </button>
                                                );
                                            },
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={form.track_stock}
                                onCheckedChange={(checked) =>
                                    setForm((current) => ({
                                        ...current,
                                        track_stock: Boolean(checked),
                                    }))
                                }
                            />
                            Track Stock
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={form.is_active}
                                onCheckedChange={(checked) =>
                                    setForm((current) => ({
                                        ...current,
                                        is_active: Boolean(checked),
                                    }))
                                }
                            />
                            Active
                        </label>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            type="button"
                            disabled={
                                processing || form.option_ids.length === 0
                            }
                            onClick={submit}
                        >
                            Update Variant Item
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
