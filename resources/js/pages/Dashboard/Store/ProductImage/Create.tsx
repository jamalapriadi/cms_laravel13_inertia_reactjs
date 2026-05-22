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

import AppLayout from '@/layouts/master-data-layout';

interface Product {
    id: string;
    name: string;
}

interface Props {
    products: Product[];
}

const imageSchema = z.object({
    product_id: z.string().min(1, 'Product is required'),
    image: z.any().refine((file) => file instanceof File, 'Image file is required'),
    is_primary: z.boolean().default(false),
    sort_order: z.coerce.number().min(0, 'Sort order cannot be negative').default(0),
});

type ImageFormData = z.infer<typeof imageSchema>;

export default function Create({ products }: Props) {
    const [processing, setProcessing] = useState(false);

    // Get product_id from query string if available
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const initialProductId = searchParams ? searchParams.get('product_id') || '' : '';

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<
        z.input<typeof imageSchema>,
        unknown,
        z.output<typeof imageSchema>
    >({
        resolver: zodResolver(imageSchema),
        defaultValues: {
            product_id: initialProductId,
            is_primary: false,
            sort_order: 0,
        },
    });

    /**
     * SUBMIT
     */
    const onSubmit = (data: ImageFormData) => {
        router.post('/dashboard/ecommerce/product-images', data, {
            preserveScroll: true,
            onStart: () => {
                setProcessing(true);
                toast.loading('Saving product image...', { id: 'save' });
            },
            onSuccess: () => {
                toast.success('Product image saved successfully!', { id: 'save' });
            },
            onFinish: () => {
                setProcessing(false);
            },
            onError: () => {
                toast.error('Failed to save image. Please check the inputs.', { id: 'save' });
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Add Product Image" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">Add Product Image</h1>
                    <p className="text-muted-foreground">Upload a new image to the product's gallery</p>
                </div>

                <hr />

                {/* FORM */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="container space-y-6 rounded-xl bg-card p-6 shadow">
                        
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* PRODUCT */}
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <Label>Product</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...register('product_id')}
                                    onChange={(e) => setValue('product_id', e.target.value)}
                                >
                                    <option value="">-- Select Product --</option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>
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

                            {/* IMAGE */}
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <Label>Image File</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setValue('image', e.target.files[0]);
                                        }
                                    }}
                                />
                                {errors.image && (
                                    <p className="text-sm text-destructive">
                                        {errors.image.message as string}
                                    </p>
                                )}
                            </div>

                            {/* SORT ORDER */}
                            <div className="flex flex-col gap-1">
                                <Label>Sort Order</Label>
                                <Input
                                    type="number"
                                    aria-invalid={!!errors.sort_order}
                                    {...register('sort_order')}
                                    min="0"
                                />
                                {errors.sort_order && (
                                    <p className="text-sm text-destructive">
                                        {errors.sort_order.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <hr className="my-6" />

                        <div className="space-y-4">
                            {/* IS PRIMARY */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_primary"
                                    checked={watch('is_primary')}
                                    onCheckedChange={(checked) =>
                                        setValue('is_primary', checked as boolean)
                                    }
                                />
                                <Label htmlFor="is_primary">Set as primary cover image for this product</Label>
                            </div>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="container flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/dashboard/ecommerce/product-images')}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={processing}>
                            {processing ? 'Please wait...' : 'Add Image'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
