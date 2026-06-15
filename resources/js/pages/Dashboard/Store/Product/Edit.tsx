import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import MediaImagePicker from '@/components/media/MediaImagePicker';
import SearchableSelect from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import TinyEditor from '@/components/ui/TinyEditor';

import AppLayout from '@/layouts/master-data-layout';

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

interface Product {
    id: string;
    category_id: string;
    brand_id?: string | null;
    unit_id?: string | null;
    name: string;
    sku?: string | null;
    thumbnail?: string | null;
    description?: string | null;
    condition: Condition;
    base_price: string | number;
    has_variant: boolean;
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
    sku: z.string().nullable().optional(),
    thumbnail: z.any().optional(),
    description: z.string().nullable().optional(),
    condition: z.enum(['new', 'like_new', 'second']).default('new'),
    base_price: z.coerce
        .number()
        .min(0, 'Price must be greater than or equal to 0')
        .default(0),
    has_variant: z.boolean().default(false),
    meta_title: z.string().nullable().optional(),
    meta_description: z.string().nullable().optional(),
    is_publish: z.boolean().default(true),
});

type ProductFormData = z.output<typeof productSchema>;

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
            sku: initialProduct.sku ?? '',
            thumbnail: initialProduct.thumbnail ?? undefined,
            description: initialProduct.description ?? '',
            condition: initialProduct.condition ?? 'new',
            base_price: initialProduct.base_price ?? 0,
            has_variant: Boolean(initialProduct.has_variant),
            meta_title: initialProduct.meta_title ?? '',
            meta_description: initialProduct.meta_description ?? '',
            is_publish: Boolean(initialProduct.is_publish),
        },
    });

    const hasVariant = watch('has_variant');

    useEffect(() => {
        register('description');
        register('thumbnail');
    }, [register]);

    useEffect(() => {
        if (hasVariant) {
            setValue('sku', '', { shouldValidate: true });
        }
    }, [hasVariant, setValue]);

    const onSubmit = (data: ProductFormData) => {
        const { thumbnail, ...productData } = data;
        const payload =
            thumbnail !== undefined
                ? { ...productData, thumbnail }
                : productData;

        router.post(
            `/my-admin/dashboard/ecommerce/products/${initialProduct.id}`,
            {
                _method: 'put',
                ...payload,
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
                    <p className="text-muted-foreground">Edit product data</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="container space-y-6 rounded-xl bg-card p-6 shadow">
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

                            <div className="flex flex-col gap-3">
                                {!hasVariant && (
                                    <div className="flex flex-col gap-1">
                                        <Label>
                                            SKU (only for products without
                                            variants)
                                        </Label>
                                        <Input
                                            type="text"
                                            aria-invalid={!!errors.sku}
                                            {...register('sku')}
                                            placeholder="e.g., IP15-BASE"
                                        />
                                        {errors.sku && (
                                            <p className="text-sm text-destructive">
                                                {errors.sku.message as string}
                                            </p>
                                        )}
                                    </div>
                                )}
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
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label>Category</Label>
                                <SearchableSelect
                                    options={categories.map((cat) => ({
                                        value: cat.id,
                                        label: cat.name,
                                    }))}
                                    value={watch('category_id')}
                                    onChange={(value) =>
                                        setValue('category_id', value ?? '', {
                                            shouldValidate: true,
                                        })
                                    }
                                    placeholder="-- Select Category --"
                                    error={errors.category_id?.message}
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label>Brand Optional</Label>
                                <SearchableSelect
                                    options={brands.map((brand) => ({
                                        value: brand.id,
                                        label: brand.name,
                                    }))}
                                    value={watch('brand_id') ?? ''}
                                    onChange={(value) =>
                                        setValue('brand_id', value || null, {
                                            shouldValidate: true,
                                        })
                                    }
                                    placeholder="-- No Brand --"
                                    error={errors.brand_id?.message}
                                    clearable
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label>Unit Optional</Label>
                                <SearchableSelect
                                    options={units.map((unit) => ({
                                        value: unit.id,
                                        label: unit.name,
                                        description: unit.code,
                                    }))}
                                    value={watch('unit_id') ?? ''}
                                    onChange={(value) =>
                                        setValue('unit_id', value || null, {
                                            shouldValidate: true,
                                        })
                                    }
                                    placeholder="-- No Unit --"
                                    error={errors.unit_id?.message}
                                    clearable
                                />
                            </div>

                            <div className="flex flex-col gap-1 md:col-span-2">
                                <Label>Thumbnail</Label>
                                <MediaImagePicker
                                    value={watch('thumbnail') as string | null}
                                    onChange={(path) =>
                                        setValue('thumbnail', path, {
                                            shouldValidate: true,
                                        })
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
                                <Label>Base Price (Rp)</Label>
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
                                router.visit(
                                    '/my-admin/dashboard/ecommerce/products',
                                )
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
