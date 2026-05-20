import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import TinyEditor from '@/components/ui/TinyEditor';

import AppLayout from '@/layouts/master-data-layout';
import { cn } from '@/lib/utils';

interface Category {
    id: string;
    name: string;
}

interface Brand {
    id: string;
    name: string;
}

interface Unit {
    id: string;
    name: string;
    code: string;
}

type Condition = 'new' | 'like_new' | 'second';

type NetworkCompatibility =
    | 'sim_free'
    | 'docomo'
    | 'au'
    | 'softbank'
    | 'rakuten'
    | 'mineo';

interface Product {
    id: string;
    category_id: string;
    brand_id?: string | null;
    unit_id?: string | null;
    name: string;
    thumbnail?: string | null;
    description?: string | null;
    condition: Condition;
    base_price: string | number;
    has_variant: boolean;
    requires_imei: boolean;
    imei_serial_number?: string | null;
    network_compatibility?: NetworkCompatibility | null;
    meta_title?: string | null;
    meta_description?: string | null;
    is_publish: boolean;
}

interface Props {
    product: Product;
    categories: Category[];
    brands: Brand[];
    units: Unit[];
}

const productSchema = z.object({
    name: z.string().min(3, 'Product name must be at least 3 characters'),
    category_id: z.string().min(1, 'Category is required'),
    brand_id: z.string().nullable().optional(),
    unit_id: z.string().nullable().optional(),
    thumbnail: z.any().optional(),
    description: z.string().nullable().optional(),
    condition: z.enum(['new', 'like_new', 'second']).default('new'),
    base_price: z.coerce
        .number()
        .min(0, 'Price must be greater than or equal to 0')
        .default(0),
    has_variant: z.boolean().default(false),
    requires_imei: z.boolean().default(false),
    imei_serial_number: z.string().nullable().optional(),
    network_compatibility: z
        .enum(['sim_free', 'docomo', 'au', 'softbank', 'rakuten', 'mineo'])
        .nullable()
        .optional(),
    meta_title: z.string().nullable().optional(),
    meta_description: z.string().nullable().optional(),
    is_publish: z.boolean().default(true),
});

type ProductFormData = z.output<typeof productSchema>;

const networkOptions: {
    value: NetworkCompatibility;
    label: string;
    desc: string;
}[] = [
    { value: 'sim_free', label: 'SIM Free', desc: 'Unlocked' },
    { value: 'docomo', label: 'Docomo', desc: 'Carrier Locked' },
    { value: 'au', label: 'AU', desc: 'Carrier Locked' },
    { value: 'softbank', label: 'SoftBank', desc: 'Carrier Locked' },
    { value: 'rakuten', label: 'Rakuten', desc: 'Carrier Locked' },
    { value: 'mineo', label: 'Mineo', desc: 'Carrier Locked' },
];

export default function Edit({
    product: initialProduct,
    categories,
    brands,
    units,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<z.input<typeof productSchema>, unknown, ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: initialProduct.name ?? '',
            category_id: initialProduct.category_id ?? '',
            brand_id: initialProduct.brand_id ?? null,
            unit_id: initialProduct.unit_id ?? null,
            description: initialProduct.description ?? '',
            condition: initialProduct.condition ?? 'new',
            base_price: initialProduct.base_price ?? 0,
            has_variant: Boolean(initialProduct.has_variant),
            requires_imei: Boolean(initialProduct.requires_imei),
            imei_serial_number: initialProduct.imei_serial_number ?? '',
            network_compatibility:
                initialProduct.network_compatibility ?? 'sim_free',
            meta_title: initialProduct.meta_title ?? '',
            meta_description: initialProduct.meta_description ?? '',
            is_publish: Boolean(initialProduct.is_publish),
        },
    });

    useEffect(() => {
        register('description');
        register('thumbnail');
    }, [register]);

    const onSubmit = (data: ProductFormData) => {
        router.post(
            `/dashboard/ecommerce/products/${initialProduct.id}`,
            {
                _method: 'put',
                ...data,
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => {
                    setProcessing(true);
                    toast.loading('Updating product...', { id: 'update' });
                },
                onSuccess: () => {
                    toast.success('Product updated successfully!', {
                        id: 'update',
                    });
                },
                onError: () => {
                    toast.error('Failed to update product.', { id: 'update' });
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Edit Product" />

            <div className="container mx-auto space-y-6 px-6 py-10">
                <div>
                    <h1 className="text-2xl font-bold">Edit Product</h1>
                    <p className="text-gray-500">Edit product data</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="container space-y-6 rounded-xl bg-white p-6 shadow">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <Label>Product Name</Label>
                                <Input
                                    type="text"
                                    aria-invalid={!!errors.name}
                                    {...register('name')}
                                    placeholder="e.g., iPhone 15 Pro Max"
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label>Category</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    {...register('category_id')}
                                >
                                    <option value="">
                                        -- Select Category --
                                    </option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category_id && (
                                    <p className="text-sm text-destructive">
                                        {errors.category_id.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label>Brand Optional</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={watch('brand_id') ?? ''}
                                    onChange={(e) =>
                                        setValue(
                                            'brand_id',
                                            e.target.value || null,
                                            { shouldValidate: true },
                                        )
                                    }
                                >
                                    <option value="">-- No Brand --</option>
                                    {brands.map((brand) => (
                                        <option key={brand.id} value={brand.id}>
                                            {brand.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
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
                            </div>

                            <div className="flex flex-col gap-1 md:col-span-2">
                                <Label>Thumbnail</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setValue(
                                            'thumbnail',
                                            e.target.files?.[0],
                                            { shouldValidate: true },
                                        )
                                    }
                                />
                            </div>

                            <div className="flex flex-col gap-1 md:col-span-2">
                                <Label>Description</Label>
                                <TinyEditor
                                    value={watch('description') || ''}
                                    onChange={(val) =>
                                        setValue('description', val, {
                                            shouldValidate: true,
                                        })
                                    }
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label>Base Price ¥</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    aria-invalid={!!errors.base_price}
                                    {...register('base_price')}
                                />
                                {errors.base_price && (
                                    <p className="text-sm text-destructive">
                                        {errors.base_price.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label>Condition</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    {...register('condition')}
                                >
                                    <option value="new">New</option>
                                    <option value="like_new">Like New</option>
                                    <option value="second">
                                        Second / Used
                                    </option>
                                </select>
                            </div>
                        </div>

                        <hr className="my-6" />

                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Device Settings
                            </h3>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="requires_imei"
                                            checked={watch('requires_imei')}
                                            onCheckedChange={(checked) =>
                                                setValue(
                                                    'requires_imei',
                                                    Boolean(checked),
                                                )
                                            }
                                        />
                                        <Label
                                            htmlFor="requires_imei"
                                            className="cursor-pointer font-medium"
                                        >
                                            Product requires IMEI / Serial
                                            Number
                                        </Label>
                                    </div>

                                    <p className="pl-6 text-xs text-gray-500">
                                        Enable this if you need to track
                                        individual device identifiers.
                                    </p>
                                </div>

                                {watch('requires_imei') && (
                                    <div className="flex flex-col gap-1">
                                        <Label>IMEI / Serial Number</Label>
                                        <Input
                                            type="text"
                                            aria-invalid={
                                                !!errors.imei_serial_number
                                            }
                                            {...register('imei_serial_number')}
                                            placeholder="Enter IMEI or Serial Number..."
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                <Label className="text-sm font-semibold">
                                    Network Compatibility
                                </Label>

                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                                    {networkOptions.map((opt) => {
                                        const selected =
                                            watch('network_compatibility') ===
                                            opt.value;

                                        const activeClass =
                                            opt.value === 'sim_free'
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                                : 'border-red-500 bg-red-50 text-red-800';

                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() =>
                                                    setValue(
                                                        'network_compatibility',
                                                        opt.value,
                                                        {
                                                            shouldValidate: true,
                                                        },
                                                    )
                                                }
                                                className={cn(
                                                    'flex flex-col items-center justify-center rounded-xl border p-4 text-center transition',
                                                    selected
                                                        ? cn(
                                                              'border-2 font-semibold shadow-sm',
                                                              activeClass,
                                                          )
                                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
                                                )}
                                            >
                                                <span className="text-xs font-bold">
                                                    {opt.label}
                                                </span>
                                                <span className="text-[10px] text-gray-400">
                                                    {opt.desc}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <hr className="my-6" />

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="flex flex-col gap-1">
                                <Label>Meta Title SEO</Label>
                                <Input
                                    type="text"
                                    aria-invalid={!!errors.meta_title}
                                    {...register('meta_title')}
                                    placeholder="SEO Title..."
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label>Meta Description SEO</Label>
                                <Textarea
                                    aria-invalid={!!errors.meta_description}
                                    {...register('meta_description')}
                                    placeholder="SEO Description..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        <hr className="my-6" />

                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="has_variant"
                                    checked={watch('has_variant')}
                                    onCheckedChange={(checked) =>
                                        setValue(
                                            'has_variant',
                                            Boolean(checked),
                                        )
                                    }
                                />
                                <Label htmlFor="has_variant">
                                    Product has variants
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_publish"
                                    checked={watch('is_publish')}
                                    onCheckedChange={(checked) =>
                                        setValue('is_publish', Boolean(checked))
                                    }
                                />
                                <Label htmlFor="is_publish">
                                    Publish immediately
                                </Label>
                            </div>
                        </div>
                    </div>

                    <div className="container flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.visit('/dashboard/ecommerce/products')
                            }
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={processing}>
                            {processing ? 'Please wait...' : 'Update Product'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
