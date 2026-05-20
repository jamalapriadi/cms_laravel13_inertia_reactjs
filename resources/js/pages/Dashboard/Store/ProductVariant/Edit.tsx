import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import AppLayout from '@/layouts/master-data-layout';

interface Product {
    id: string;
    name: string;
}

interface Unit {
    id: string;
    name: string;
    code: string;
}

interface ProductVariant {
    id: string;
    product_id: string;
    unit_id?: string | null;
    name: string;
    sku: string;
    price: string | number;
    track_stock: boolean;
    stock: number;
    min_stock_alert?: number | null;
    weight?: number | null;
    cost_price?: string | number | null;
    is_active: boolean;
}

interface Props {
    variant: ProductVariant;
    products: Product[];
    units: Unit[];
}

const nullableNumber = z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) {
        return null;
    }

    return Number(val);
}, z.number().min(0).nullable());

const variantSchema = z.object({
    product_id: z.string().min(1, 'Product is required'),

    unit_id: z.string().nullable().optional(),

    name: z.string().min(1, 'Variant name is required'),

    sku: z.string().min(1, 'SKU is required'),

    price: z.coerce.number().min(0, 'Price must be >= 0').default(0),

    track_stock: z.boolean().default(true),

    stock: z.coerce.number().min(0, 'Stock cannot be negative').default(0),

    min_stock_alert: nullableNumber.optional(),

    weight: nullableNumber.optional(),

    cost_price: nullableNumber.optional(),

    is_active: z.boolean().default(true),
});

type VariantFormData = z.output<typeof variantSchema>;

export default function Edit({
    variant: initialVariant,
    products,
    units,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<z.input<typeof variantSchema>, unknown, VariantFormData>({
        resolver: zodResolver(variantSchema),

        defaultValues: {
            product_id: initialVariant.product_id ?? '',
            unit_id: initialVariant.unit_id ?? null,
            name: initialVariant.name ?? '',
            sku: initialVariant.sku ?? '',
            price: Number(initialVariant.price ?? 0),
            track_stock: Boolean(initialVariant.track_stock),
            stock: Number(initialVariant.stock ?? 0),
            min_stock_alert: initialVariant.min_stock_alert ?? null,
            weight: initialVariant.weight ?? null,
            cost_price: initialVariant.cost_price
                ? Number(initialVariant.cost_price)
                : null,
            is_active: Boolean(initialVariant.is_active),
        },
    });

    const onSubmit = (data: VariantFormData) => {
        router.post(
            `/dashboard/ecommerce/product-variants/${initialVariant.id}`,
            {
                _method: 'put',
                ...data,
            },
            {
                preserveScroll: true,

                onStart: () => {
                    setProcessing(true);

                    toast.loading('Updating variant...', {
                        id: 'update',
                    });
                },

                onSuccess: () => {
                    toast.success('Variant updated successfully!', {
                        id: 'update',
                    });
                },

                onError: () => {
                    toast.error(
                        'Failed to update variant. Please check the inputs.',
                        {
                            id: 'update',
                        },
                    );
                },

                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Edit Product Variant" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                <div>
                    <h1 className="text-2xl font-bold">Edit Product Variant</h1>

                    <p className="text-gray-500">Edit variant details</p>
                </div>

                <hr />

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="container space-y-6 rounded-xl bg-white p-6 shadow">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* PRODUCT */}
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <Label>Product</Label>

                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={watch('product_id')}
                                    onChange={(e) =>
                                        setValue('product_id', e.target.value, {
                                            shouldValidate: true,
                                        })
                                    }
                                >
                                    <option value="">
                                        -- Select Product --
                                    </option>

                                    {products.map((product) => (
                                        <option
                                            key={product.id}
                                            value={product.id}
                                        >
                                            {product.name}
                                        </option>
                                    ))}
                                </select>

                                {errors.product_id && (
                                    <p className="text-sm text-destructive">
                                        {errors.product_id.message}
                                    </p>
                                )}
                            </div>

                            {/* UNIT */}
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <Label>Unit Optional</Label>

                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={watch('unit_id') ?? ''}
                                    onChange={(e) =>
                                        setValue(
                                            'unit_id',
                                            e.target.value || null,
                                            {
                                                shouldValidate: true,
                                            },
                                        )
                                    }
                                >
                                    <option value="">-- No Unit --</option>

                                    {units.map((unit) => (
                                        <option key={unit.id} value={unit.id}>
                                            {unit.name} ({unit.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* NAME */}
                            <div className="flex flex-col gap-1">
                                <Label>Variant Name</Label>

                                <Input
                                    type="text"
                                    {...register('name')}
                                    placeholder="e.g., Red - XL"
                                />

                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            {/* SKU */}
                            <div className="flex flex-col gap-1">
                                <Label>SKU</Label>

                                <Input
                                    type="text"
                                    {...register('sku')}
                                    placeholder="e.g., IPH15-RED-XL"
                                />

                                {errors.sku && (
                                    <p className="text-sm text-destructive">
                                        {errors.sku.message}
                                    </p>
                                )}
                            </div>

                            {/* PRICE */}
                            <div className="flex flex-col gap-1">
                                <Label>Price ¥</Label>

                                <Input
                                    type="number"
                                    min="0"
                                    {...register('price')}
                                />
                            </div>

                            {/* COST PRICE */}
                            <div className="flex flex-col gap-1">
                                <Label>Cost Price ¥</Label>

                                <Input
                                    type="number"
                                    min="0"
                                    {...register('cost_price')}
                                />
                            </div>

                            {/* STOCK */}
                            <div className="flex flex-col gap-1">
                                <Label>Stock</Label>

                                <Input
                                    type="number"
                                    min="0"
                                    disabled={!watch('track_stock')}
                                    {...register('stock')}
                                />
                            </div>

                            {/* MIN STOCK ALERT */}
                            <div className="flex flex-col gap-1">
                                <Label>Min Stock Alert</Label>

                                <Input
                                    type="number"
                                    min="0"
                                    disabled={!watch('track_stock')}
                                    {...register('min_stock_alert')}
                                />
                            </div>

                            {/* WEIGHT */}
                            <div className="flex flex-col gap-1">
                                <Label>Weight grams</Label>

                                <Input
                                    type="number"
                                    min="0"
                                    {...register('weight')}
                                />
                            </div>
                        </div>

                        <hr className="my-6" />

                        <div className="space-y-4">
                            {/* TRACK STOCK */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="track_stock"
                                    checked={watch('track_stock')}
                                    onCheckedChange={(checked) =>
                                        setValue(
                                            'track_stock',
                                            Boolean(checked),
                                        )
                                    }
                                />

                                <Label htmlFor="track_stock">
                                    Track Inventory for this variant
                                </Label>
                            </div>

                            {/* IS ACTIVE */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_active"
                                    checked={watch('is_active')}
                                    onCheckedChange={(checked) =>
                                        setValue('is_active', Boolean(checked))
                                    }
                                />

                                <Label htmlFor="is_active">
                                    Variant is active
                                </Label>
                            </div>
                        </div>
                    </div>

                    <div className="container flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.visit(
                                    '/dashboard/ecommerce/product-variants',
                                )
                            }
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={processing}>
                            {processing ? 'Please wait...' : 'Update Variant'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
