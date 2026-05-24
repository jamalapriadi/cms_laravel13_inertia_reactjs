import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import MediaImagePicker from '@/components/media/MediaImagePicker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';

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

type NetworkCompatibility =
    | 'sim_free'
    | 'docomo'
    | 'au'
    | 'softbank'
    | 'rakuten'
    | 'mineo';

type StockUnitStatus = 'available' | 'reserved' | 'sold' | 'damaged';

interface StockUnitInput {
    imei_serial_number: string;
    network_compatibility: NetworkCompatibility;
    status: StockUnitStatus;
    note: string;
}

const networkOptions: { value: NetworkCompatibility; label: string }[] = [
    { value: 'sim_free', label: 'All Operator' },
    { value: 'docomo', label: 'Docomo' },
    { value: 'au', label: 'AU' },
    { value: 'softbank', label: 'SoftBank' },
    { value: 'rakuten', label: 'Rakuten' },
    { value: 'mineo', label: 'Mineo' },
];

const variantSchema = z.object({
    product_id: z.string().min(1, 'Product is required'),
    unit_id: z.string().nullable().optional(),
    name: z.string().min(1, 'Variant name is required'),
    color: z.string().nullable().optional(),
    storage: z.string().nullable().optional(),
    sku: z.string().min(1, 'SKU is required'),
    image: z.any().optional(),
    price: z.coerce.number().min(0, 'Price must be >= 0').default(0),
    track_stock: z.boolean().default(true),
    min_stock_alert: z.coerce.number().min(0).nullable().optional(),
    weight: z.coerce.number().min(0).nullable().optional(),
    cost_price: z.coerce.number().min(0).nullable().optional(),
    is_active: z.boolean().default(true),
});

type VariantFormData = z.output<typeof variantSchema>;

export default function Create({ products, units }: Props) {
    const [processing, setProcessing] = useState(false);
    const [stockUnits, setStockUnits] = useState<StockUnitInput[]>([]);

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
            color: '',
            storage: '',
            sku: '',
            image: undefined,
            price: 0,
            track_stock: true,
            min_stock_alert: null,
            weight: null,
            cost_price: null,
            is_active: true,
        },
    });

    const addStockUnit = () => {
        setStockUnits((items) => [
            ...items,
            {
                imei_serial_number: '',
                network_compatibility: 'sim_free',
                status: 'available',
                note: '',
            },
        ]);
    };

    const updateStockUnit = <K extends keyof StockUnitInput>(
        index: number,
        key: K,
        value: StockUnitInput[K],
    ) => {
        setStockUnits((items) =>
            items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [key]: value } : item,
            ),
        );
    };

    const removeStockUnit = (index: number) => {
        setStockUnits((items) =>
            items.filter((_, itemIndex) => itemIndex !== index),
        );
    };

    const onSubmit = (data: VariantFormData) => {
        const payload = {
            ...data,
            stock_units: stockUnits.filter((stockUnit) =>
                stockUnit.imei_serial_number.trim(),
            ),
        };

        router.post(
            '/dashboard/ecommerce/product-variants',
            payload as unknown as Record<string, never>,
            {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => {
                    setProcessing(true);
                    toast.loading('Saving variant...', { id: 'save' });
                },
                onSuccess: () => {
                    toast.success('Variant created successfully!', {
                        id: 'save',
                    });
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
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Create Product Variant" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                <div>
                    <h1 className="text-2xl font-bold">
                        Create Product Variant
                    </h1>
                    <p className="text-muted-foreground">
                        Add a new variant for a product
                    </p>
                </div>

                <hr />

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="container space-y-6 rounded-xl bg-card p-6 shadow">
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
                                <Label>Color / Warna</Label>
                                <Input
                                    type="text"
                                    aria-invalid={!!errors.color}
                                    {...register('color')}
                                    placeholder="e.g., Silver"
                                />
                                {errors.color && (
                                    <p className="text-sm text-destructive">
                                        {errors.color.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label>Storage</Label>
                                <Input
                                    type="text"
                                    aria-invalid={!!errors.storage}
                                    {...register('storage')}
                                    placeholder="e.g., 256GB"
                                />
                                {errors.storage && (
                                    <p className="text-sm text-destructive">
                                        {errors.storage.message}
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

                            <div className="flex flex-col gap-1 md:col-span-2">
                                <Label>Variant Image</Label>
                                <MediaImagePicker
                                    value={watch('image') as string | null}
                                    onChange={(path) =>
                                        setValue('image', path, {
                                            shouldValidate: true,
                                        })
                                    }
                                />
                                {errors.image && (
                                    <p className="text-sm text-destructive">
                                        {errors.image.message as string}
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

                        <hr className="my-6" />

                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Initial Stock Units
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Add IMEI/serial units for this variant.
                                        Available units will increase stock
                                        automatically.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addStockUnit}
                                >
                                    Add Stock Unit
                                </Button>
                            </div>

                            {stockUnits.length === 0 ? (
                                <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">
                                    No stock units added yet.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {stockUnits.map((stockUnit, index) => (
                                        <div
                                            key={index}
                                            className="rounded-md border bg-muted/50 p-4"
                                        >
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div className="flex flex-col gap-1">
                                                    <Label>
                                                        IMEI / Serial Number
                                                    </Label>
                                                    <Input
                                                        value={
                                                            stockUnit.imei_serial_number
                                                        }
                                                        onChange={(event) =>
                                                            updateStockUnit(
                                                                index,
                                                                'imei_serial_number',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="e.g., 351234567890123"
                                                    />
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    <Label>Status</Label>
                                                    <select
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        value={stockUnit.status}
                                                        onChange={(event) =>
                                                            updateStockUnit(
                                                                index,
                                                                'status',
                                                                event.target
                                                                    .value as StockUnitStatus,
                                                            )
                                                        }
                                                    >
                                                        <option value="available">
                                                            Available
                                                        </option>
                                                        <option value="reserved">
                                                            Reserved
                                                        </option>
                                                        <option value="sold">
                                                            Sold
                                                        </option>
                                                        <option value="damaged">
                                                            Damaged
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="mt-4 space-y-2">
                                                <Label>Network</Label>
                                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                                    {networkOptions.map(
                                                        (option) => {
                                                            const selected =
                                                                stockUnit.network_compatibility ===
                                                                option.value;

                                                            return (
                                                                <button
                                                                    key={
                                                                        option.value
                                                                    }
                                                                    type="button"
                                                                    onClick={() =>
                                                                        updateStockUnit(
                                                                            index,
                                                                            'network_compatibility',
                                                                            option.value,
                                                                        )
                                                                    }
                                                                    className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                                                                        selected
                                                                            ? option.value ===
                                                                              'sim_free'
                                                                                ? 'border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                                : 'border-red-500 bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                                                                            : 'border-border bg-card text-muted-foreground hover:border-border'
                                                                    }`}
                                                                >
                                                                    {
                                                                        option.label
                                                                    }
                                                                </button>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-col gap-1">
                                                <Label>Note</Label>
                                                <Textarea
                                                    rows={2}
                                                    value={stockUnit.note}
                                                    onChange={(event) =>
                                                        updateStockUnit(
                                                            index,
                                                            'note',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Optional internal note..."
                                                />
                                            </div>

                                            <div className="mt-4 flex justify-end">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        removeStockUnit(index)
                                                    }
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
