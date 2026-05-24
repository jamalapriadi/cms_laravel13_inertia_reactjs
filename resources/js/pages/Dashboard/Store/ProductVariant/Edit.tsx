import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import MediaImagePicker from '@/components/media/MediaImagePicker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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

interface ProductVariant {
    id: string;
    product_id: string;
    unit_id?: string | null;
    name: string;
    color?: string | null;
    storage?: string | null;
    sku: string;
    image?: string | null;
    price: string | number;
    track_stock: boolean;
    stock: number;
    available_stock_units_count?: number;
    min_stock_alert?: number | null;
    weight?: number | null;
    cost_price?: string | number | null;
    is_active: boolean;
    stock_units?: ProductStockUnit[];
}

interface Props {
    variant: ProductVariant;
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

interface ProductStockUnit {
    id: string;
    product_variant_id: string;
    imei_serial_number: string;
    network_compatibility: NetworkCompatibility;
    status: 'available' | 'reserved' | 'sold' | 'damaged';
    note?: string | null;
}

const networkOptions: { value: NetworkCompatibility; label: string }[] = [
    { value: 'sim_free', label: 'All Operator' },
    { value: 'docomo', label: 'Docomo' },
    { value: 'au', label: 'AU' },
    { value: 'softbank', label: 'SoftBank' },
    { value: 'rakuten', label: 'Rakuten' },
    { value: 'mineo', label: 'Mineo' },
];

const networkLabel = (network: NetworkCompatibility) =>
    networkOptions.find((option) => option.value === network)?.label ?? network;

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

    color: z.string().nullable().optional(),

    storage: z.string().nullable().optional(),

    sku: z.string().min(1, 'SKU is required'),

    image: z.any().optional(),

    price: z.coerce.number().min(0, 'Price must be >= 0').default(0),

    track_stock: z.boolean().default(true),

    min_stock_alert: nullableNumber.optional(),

    weight: nullableNumber.optional(),

    cost_price: nullableNumber.optional(),

    is_active: z.boolean().default(true),
});

type VariantFormData = z.output<typeof variantSchema>;

const stockUnitSchema = z.object({
    product_variant_id: z.string().min(1, 'Product variant is required'),
    imei_serial_number: z
        .string()
        .min(1, 'IMEI / Serial Number is required')
        .max(255),
    network_compatibility: z.enum([
        'sim_free',
        'docomo',
        'au',
        'softbank',
        'rakuten',
        'mineo',
    ]),
    status: z
        .enum(['available', 'reserved', 'sold', 'damaged'])
        .default('available'),
    note: z.string().nullable().optional(),
});

type StockUnitFormData = z.infer<typeof stockUnitSchema>;

export default function Edit({
    variant: initialVariant,
    products,
    units,
}: Props) {
    const [processing, setProcessing] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [editingStockUnit, setEditingStockUnit] =
        useState<ProductStockUnit | null>(null);
    const [submittingStock, setSubmittingStock] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<z.input<typeof variantSchema>, unknown, VariantFormData>({
        resolver: zodResolver(variantSchema),

        defaultValues: {
            product_id: initialVariant.product_id ?? '',
            unit_id: initialVariant.unit_id ?? null,
            name: initialVariant.name ?? '',
            color: initialVariant.color ?? '',
            storage: initialVariant.storage ?? '',
            sku: initialVariant.sku ?? '',
            image: initialVariant.image ?? undefined,
            price: Number(initialVariant.price ?? 0),
            track_stock: Boolean(initialVariant.track_stock),
            min_stock_alert: initialVariant.min_stock_alert ?? null,
            weight: initialVariant.weight ?? null,
            cost_price: initialVariant.cost_price
                ? Number(initialVariant.cost_price)
                : null,
            is_active: Boolean(initialVariant.is_active),
        },
    });
    const selectedProductId = useWatch({ control, name: 'product_id' });
    const selectedUnitId = useWatch({ control, name: 'unit_id' });
    const trackStock = useWatch({ control, name: 'track_stock' });
    const isActive = useWatch({ control, name: 'is_active' });
    const selectedImage = useWatch({ control, name: 'image' });

    const stockUnitForm = useForm<
        z.input<typeof stockUnitSchema>,
        unknown,
        StockUnitFormData
    >({
        resolver: zodResolver(stockUnitSchema),
        defaultValues: {
            product_variant_id: initialVariant.id,
            imei_serial_number: '',
            network_compatibility: 'sim_free',
            status: 'available',
            note: '',
        },
    });
    const stockUnitStatus = useWatch({
        control: stockUnitForm.control,
        name: 'status',
    });
    const selectedNetworkCompatibility = useWatch({
        control: stockUnitForm.control,
        name: 'network_compatibility',
    });

    const openCreateStockModal = () => {
        setEditingStockUnit(null);
        stockUnitForm.reset({
            product_variant_id: initialVariant.id,
            imei_serial_number: '',
            network_compatibility: 'sim_free',
            status: 'available',
            note: '',
        });
        setIsStockModalOpen(true);
    };

    const openEditStockModal = (stockUnit: ProductStockUnit) => {
        setEditingStockUnit(stockUnit);
        stockUnitForm.reset({
            product_variant_id: stockUnit.product_variant_id,
            imei_serial_number: stockUnit.imei_serial_number,
            network_compatibility: stockUnit.network_compatibility,
            status: stockUnit.status,
            note: stockUnit.note ?? '',
        });
        setIsStockModalOpen(true);
    };

    const onSubmitStockUnit = (data: StockUnitFormData) => {
        if (editingStockUnit) {
            router.put(
                `/dashboard/ecommerce/product-stock-units/${editingStockUnit.id}`,
                data,
                {
                    preserveScroll: true,
                    onStart: () => {
                        setSubmittingStock(true);
                        toast.loading('Updating stock unit...', {
                            id: 'stock-unit',
                        });
                    },
                    onSuccess: () => {
                        toast.success('Stock unit updated successfully!', {
                            id: 'stock-unit',
                        });
                        setIsStockModalOpen(false);
                        setEditingStockUnit(null);
                    },
                    onError: () => {
                        toast.error(
                            'Failed to update stock unit. Check IMEI uniqueness.',
                            { id: 'stock-unit' },
                        );
                    },
                    onFinish: () => setSubmittingStock(false),
                },
            );

            return;
        }

        router.post('/dashboard/ecommerce/product-stock-units', data, {
            preserveScroll: true,
            onStart: () => {
                setSubmittingStock(true);
                toast.loading('Adding stock unit...', { id: 'stock-unit' });
            },
            onSuccess: () => {
                toast.success('Stock unit added successfully!', {
                    id: 'stock-unit',
                });
                setIsStockModalOpen(false);
            },
            onError: () => {
                toast.error(
                    'Failed to add stock unit. Check IMEI uniqueness.',
                    { id: 'stock-unit' },
                );
            },
            onFinish: () => setSubmittingStock(false),
        });
    };

    const deleteStockUnit = (stockUnit: ProductStockUnit) => {
        router.delete(
            `/dashboard/ecommerce/product-stock-units/${stockUnit.id}`,
            {
                preserveScroll: true,
            },
        );
    };

    const onSubmit = (data: VariantFormData) => {
        const payload = { ...data };

        if (payload.image === undefined) {
            delete payload.image;
        }

        router.post(
            `/dashboard/ecommerce/product-variants/${initialVariant.id}`,
            {
                _method: 'put',
                ...payload,
            },
            {
                forceFormData: true,
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

                    <p className="text-muted-foreground">
                        Edit variant details
                    </p>
                </div>

                <hr />

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="container space-y-6 rounded-xl bg-card p-6 shadow">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* PRODUCT */}
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <Label>Product</Label>

                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={selectedProductId}
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
                                    value={selectedUnitId ?? ''}
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

                            {/* COLOR */}
                            <div className="flex flex-col gap-1">
                                <Label>Color / Warna</Label>

                                <Input
                                    type="text"
                                    {...register('color')}
                                    placeholder="e.g., Silver"
                                />

                                {errors.color && (
                                    <p className="text-sm text-destructive">
                                        {errors.color.message}
                                    </p>
                                )}
                            </div>

                            {/* STORAGE */}
                            <div className="flex flex-col gap-1">
                                <Label>Storage</Label>

                                <Input
                                    type="text"
                                    {...register('storage')}
                                    placeholder="e.g., 256GB"
                                />

                                {errors.storage && (
                                    <p className="text-sm text-destructive">
                                        {errors.storage.message}
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

                            <div className="flex flex-col gap-1 md:col-span-2">
                                <Label>Variant Image</Label>
                                <MediaImagePicker
                                    value={selectedImage as string | null}
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

                            {/* MIN STOCK ALERT */}
                            <div className="flex flex-col gap-1">
                                <Label>Min Stock Alert</Label>

                                <Input
                                    type="number"
                                    min="0"
                                    disabled={!trackStock}
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
                                    checked={trackStock}
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
                                    checked={isActive}
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

                <div className="container space-y-6 rounded-xl bg-card p-6 shadow">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Stock Units / IMEI
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Current stock:{' '}
                                {initialVariant.available_stock_units_count ??
                                    initialVariant.stock}
                                . Available stock units control this number
                                automatically.
                            </p>
                        </div>
                        <Button type="button" onClick={openCreateStockModal}>
                            Add Stock Unit
                        </Button>
                    </div>

                    {initialVariant.stock_units &&
                    initialVariant.stock_units.length > 0 ? (
                        <div className="space-y-3">
                            {initialVariant.stock_units.map((stockUnit) => (
                                <div
                                    key={stockUnit.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/50 px-4 py-3"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate font-mono text-sm font-semibold">
                                            {stockUnit.imei_serial_number}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {networkLabel(
                                                stockUnit.network_compatibility,
                                            )}{' '}
                                            · {stockUnit.status}
                                        </div>
                                        {stockUnit.note && (
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {stockUnit.note}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={() =>
                                                openEditStockModal(stockUnit)
                                            }
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            onClick={() =>
                                                deleteStockUnit(stockUnit)
                                            }
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">
                            No stock units added for this variant yet.
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isStockModalOpen} onOpenChange={setIsStockModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingStockUnit
                                ? 'Edit Stock Unit / IMEI'
                                : 'Add Stock Unit / IMEI'}
                        </DialogTitle>
                        <DialogDescription>
                            Assign IMEI/serial number and network to this
                            product variant.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={stockUnitForm.handleSubmit(onSubmitStockUnit)}
                        className="space-y-5 py-2"
                    >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="imei_serial_number">
                                    IMEI / Serial Number
                                </Label>
                                <Input
                                    id="imei_serial_number"
                                    placeholder="e.g., 351234567890123"
                                    {...stockUnitForm.register(
                                        'imei_serial_number',
                                    )}
                                />
                                {stockUnitForm.formState.errors
                                    .imei_serial_number && (
                                    <p className="text-xs text-destructive">
                                        {
                                            stockUnitForm.formState.errors
                                                .imei_serial_number.message
                                        }
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={stockUnitStatus}
                                    onChange={(e) =>
                                        stockUnitForm.setValue(
                                            'status',
                                            e.target
                                                .value as StockUnitFormData['status'],
                                            { shouldValidate: true },
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
                            <Label>Network</Label>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {networkOptions.map((option) => {
                                    const selected =
                                        selectedNetworkCompatibility ===
                                        option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() =>
                                                stockUnitForm.setValue(
                                                    'network_compatibility',
                                                    option.value,
                                                    { shouldValidate: true },
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
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="note">Note</Label>
                            <Textarea
                                id="note"
                                rows={3}
                                placeholder="Optional internal note..."
                                {...stockUnitForm.register('note')}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsStockModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submittingStock}>
                                {submittingStock
                                    ? 'Saving...'
                                    : editingStockUnit
                                      ? 'Update Stock Unit'
                                      : 'Add Stock Unit'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
