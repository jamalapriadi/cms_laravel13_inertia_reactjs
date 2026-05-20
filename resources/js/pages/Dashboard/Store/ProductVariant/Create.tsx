import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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

interface Props {
    products: Product[];
    units: Unit[];
}

const variantSchema = z.object({
    product_id: z.string().min(1, 'Product is required'),
    unit_id: z.string().nullable().optional(),
    name: z.string().min(1, 'Variant name is required'),
    sku: z.string().min(1, 'SKU is required'),
    price: z.coerce.number().min(0, 'Price must be >= 0').default(0),
    track_stock: z.boolean().default(true),
    stock: z.coerce.number().min(0, 'Stock cannot be negative').default(0),
    min_stock_alert: z.coerce.number().min(0).nullable().optional(),
    weight: z.coerce.number().min(0).nullable().optional(),
    cost_price: z.coerce.number().min(0).nullable().optional(),
    is_active: z.boolean().default(true),
});

type VariantFormData = z.output<typeof variantSchema>;

export default function Create({ products, units }: Props) {
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
            product_id: '',
            unit_id: null,
            name: '',
            sku: '',
            price: 0,
            track_stock: true,
            stock: 0,
            min_stock_alert: null,
            weight: null,
            cost_price: null,
            is_active: true,
        },
    });

    const onSubmit = (data: VariantFormData) => {
        router.post('/dashboard/ecommerce/product-variants', data, {
            preserveScroll: true,
            onStart: () => {
                setProcessing(true);
                toast.loading('Saving variant...', { id: 'save' });
            },
            onSuccess: () => {
                toast.success('Variant created successfully!', { id: 'save' });
            },
            onError: () => {
                toast.error(
                    'Failed to create variant. Please check the inputs.',
                    { id: 'save' },
                );
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Create Product Variant" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                <div>
                    <h1 className="text-2xl font-bold">
                        Create Product Variant
                    </h1>
                    <p className="text-gray-500">
                        Add a new variant for a product
                    </p>
                </div>

                <hr />

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="container space-y-6 rounded-xl bg-white p-6 shadow">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <Label>Product</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    {...register('product_id')}
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

                            <div className="flex flex-col gap-1 md:col-span-2">
                                <Label>Unit Optional</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={watch('unit_id') ?? ''}
                                    onChange={(e) =>
                                        setValue(
                                            'unit_id',
                                            e.target.value || null,
                                            { shouldValidate: true },
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

                                {errors.unit_id && (
                                    <p className="text-sm text-destructive">
                                        {errors.unit_id.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label>Variant Name</Label>
                                <Input
                                    type="text"
                                    aria-invalid={!!errors.name}
                                    {...register('name')}
                                    placeholder="e.g., Red - XL"
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label>SKU</Label>
                                <Input
                                    type="text"
                                    aria-invalid={!!errors.sku}
                                    {...register('sku')}
                                    placeholder="e.g., IPH15-RED-XL"
                                />
                                {errors.sku && (
                                    <p className="text-sm text-destructive">
                                        {errors.sku.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label>Price ¥</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    aria-invalid={!!errors.price}
                                    {...register('price')}
                                />
                                {errors.price && (
                                    <p className="text-sm text-destructive">
                                        {errors.price.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label>Cost Price ¥</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    aria-invalid={!!errors.cost_price}
                                    {...register('cost_price')}
                                />
                                {errors.cost_price && (
                                    <p className="text-sm text-destructive">
                                        {errors.cost_price.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label>Stock</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    aria-invalid={!!errors.stock}
                                    {...register('stock')}
                                    disabled={!watch('track_stock')}
                                />
                                {errors.stock && (
                                    <p className="text-sm text-destructive">
                                        {errors.stock.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label>Min Stock Alert</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    aria-invalid={!!errors.min_stock_alert}
                                    {...register('min_stock_alert')}
                                    disabled={!watch('track_stock')}
                                />
                                {errors.min_stock_alert && (
                                    <p className="text-sm text-destructive">
                                        {errors.min_stock_alert.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label>Weight grams</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    aria-invalid={!!errors.weight}
                                    {...register('weight')}
                                />
                                {errors.weight && (
                                    <p className="text-sm text-destructive">
                                        {errors.weight.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <hr className="my-6" />

                        <div className="space-y-4">
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
                            {processing ? 'Please wait...' : 'Create Variant'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
