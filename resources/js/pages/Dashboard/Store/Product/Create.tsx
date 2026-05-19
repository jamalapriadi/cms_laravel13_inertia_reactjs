import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Textarea from '@/components/ui/textarea';

import AppLayout from '@/layouts/master-data-layout';

interface Category {
    id: string;
    name: string;
}

interface Brand {
    id: string;
    name: string;
}

interface Props {
    categories: Category[];
    brands: Brand[];
}

const productSchema = z.object({
    name: z.string().min(3, 'Product name must be at least 3 characters'),
    category_id: z.string().min(1, 'Category is required'),
    brand_id: z.string().nullable().optional(),
    thumbnail: z.any().optional(),
    description: z.string().nullable().optional(),
    condition: z.enum(['new', 'like_new', 'second']).default('new'),
    base_price: z.coerce.number().min(0, 'Price must be greater than or equal to 0').default(0),
    has_variant: z.boolean().default(false),
    meta_title: z.string().nullable().optional(),
    meta_description: z.string().nullable().optional(),
    is_publish: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function Create({ categories, brands }: Props) {
    const [processing, setProcessing] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<
        z.input<typeof productSchema>,
        unknown,
        z.output<typeof productSchema>
    >({
        resolver: zodResolver(productSchema),
        defaultValues: {
            brand_id: null,
            condition: 'new',
            base_price: 0,
            has_variant: false,
            is_publish: true,
        },
    });

    /**
     * SUBMIT
     */
    const onSubmit = (data: ProductFormData) => {
        router.post('/dashboard/ecommerce/products', data, {
            preserveScroll: true,
            onStart: () => {
                setProcessing(true);

                toast.loading('Saving product...', {
                    id: 'save',
                });
            },

            onSuccess: () => {
                toast.success('Product created successfully!', {
                    id: 'save',
                });
            },

            onFinish: () => {
                setProcessing(false);
            },

            onError: () => {
                toast.error(
                    'Failed to create product. Please check the inputs.',
                    { id: 'save' },
                );
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Create Product" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">Create Product</h1>
                    <p className="text-gray-500">Add a new product to the store</p>
                </div>

                <hr />

                {/* FORM */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="container space-y-6 rounded-xl bg-white p-6 shadow">
                        
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* NAME */}
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

                            {/* CATEGORY */}
                            <div className="flex flex-col gap-1">
                                <Label>Category</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...register('category_id')}
                                    onChange={(e) => setValue('category_id', e.target.value)}
                                >
                                    <option value="">-- Select Category --</option>
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

                            {/* BRAND */}
                            <div className="flex flex-col gap-1">
                                <Label>Brand (Optional)</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...register('brand_id')}
                                    onChange={(e) => setValue('brand_id', e.target.value === '' ? null : e.target.value)}
                                >
                                    <option value="">-- No Brand --</option>
                                    {brands.map((brand) => (
                                        <option key={brand.id} value={brand.id}>
                                            {brand.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.brand_id && (
                                    <p className="text-sm text-destructive">
                                        {errors.brand_id.message}
                                    </p>
                                )}
                            </div>

                            {/* THUMBNAIL */}
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <Label>Thumbnail</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setValue('thumbnail', e.target.files[0]);
                                        }
                                    }}
                                />
                                {errors.thumbnail && (
                                    <p className="text-sm text-destructive">
                                        {errors.thumbnail.message as string}
                                    </p>
                                )}
                            </div>

                            {/* DESCRIPTION */}
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <Label>Description</Label>
                                <Textarea
                                    aria-invalid={!!errors.description}
                                    {...register('description')}
                                    placeholder="Product description..."
                                    rows={5}
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">
                                        {errors.description.message}
                                    </p>
                                )}
                            </div>

                            {/* BASE PRICE */}
                            <div className="flex flex-col gap-1">
                                <Label>Base Price (Rp)</Label>
                                <Input
                                    type="number"
                                    aria-invalid={!!errors.base_price}
                                    {...register('base_price')}
                                    placeholder="e.g., 15000000"
                                    min="0"
                                />
                                {errors.base_price && (
                                    <p className="text-sm text-destructive">
                                        {errors.base_price.message}
                                    </p>
                                )}
                            </div>

                            {/* CONDITION */}
                            <div className="flex flex-col gap-1">
                                <Label>Condition</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...register('condition')}
                                    onChange={(e) => setValue('condition', e.target.value as 'new' | 'like_new' | 'second')}
                                >
                                    <option value="new">New</option>
                                    <option value="like_new">Like New</option>
                                    <option value="second">Second / Used</option>
                                </select>
                                {errors.condition && (
                                    <p className="text-sm text-destructive">
                                        {errors.condition.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <hr className="my-6" />

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* META TITLE */}
                            <div className="flex flex-col gap-1">
                                <Label>Meta Title (SEO)</Label>
                                <Input
                                    type="text"
                                    aria-invalid={!!errors.meta_title}
                                    {...register('meta_title')}
                                    placeholder="SEO Title..."
                                />
                                {errors.meta_title && (
                                    <p className="text-sm text-destructive">
                                        {errors.meta_title.message}
                                    </p>
                                )}
                            </div>

                            {/* META DESCRIPTION */}
                            <div className="flex flex-col gap-1">
                                <Label>Meta Description (SEO)</Label>
                                <Textarea
                                    aria-invalid={!!errors.meta_description}
                                    {...register('meta_description')}
                                    placeholder="SEO Description..."
                                    rows={3}
                                />
                                {errors.meta_description && (
                                    <p className="text-sm text-destructive">
                                        {errors.meta_description.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <hr className="my-6" />

                        <div className="space-y-4">
                            {/* HAS VARIANT */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="has_variant"
                                    checked={watch('has_variant')}
                                    onCheckedChange={(checked) =>
                                        setValue('has_variant', checked as boolean)
                                    }
                                />
                                <Label htmlFor="has_variant">Product has variants (e.g., colors, sizes)</Label>
                            </div>

                            {/* IS PUBLISHED */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_publish"
                                    checked={watch('is_publish')}
                                    onCheckedChange={(checked) =>
                                        setValue('is_publish', checked as boolean)
                                    }
                                />
                                <Label htmlFor="is_publish">Publish immediately</Label>
                            </div>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="container flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/dashboard/ecommerce/products')}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={processing}>
                            {processing ? 'Please wait...' : 'Create Product'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
