import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';

import AppLayout from '@/layouts/master-data-layout';

interface Product {
    id: string;
    name: string;
}

interface Props {
    products: Product[];
}

const specSchema = z.object({
    product_id: z.string().min(1, 'Product is required'),
    spec_name: z.string().min(1, 'Specification name is required'),
    spec_value: z.string().min(1, 'Specification value is required'),
});

type SpecFormData = z.infer<typeof specSchema>;

export default function Create({ products }: Props) {
    const [processing, setProcessing] = useState(false);

    // Get product_id from query string if available
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const initialProductId = searchParams ? searchParams.get('product_id') || '' : '';

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<
        z.input<typeof specSchema>,
        unknown,
        z.output<typeof specSchema>
    >({
        resolver: zodResolver(specSchema),
        defaultValues: {
            product_id: initialProductId,
        },
    });

    /**
     * SUBMIT
     */
    const onSubmit = (data: SpecFormData) => {
        router.post('/dashboard/ecommerce/product-specifications', data, {
            preserveScroll: true,
            onStart: () => {
                setProcessing(true);
                toast.loading('Saving specification...', { id: 'save' });
            },
            onSuccess: () => {
                toast.success('Specification saved successfully!', { id: 'save' });
            },
            onFinish: () => {
                setProcessing(false);
            },
            onError: () => {
                toast.error('Failed to save specification. Please check the inputs.', { id: 'save' });
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Add Product Specification" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">Add Product Specification</h1>
                    <p className="text-gray-500">Define a technical specification for a product</p>
                </div>

                <hr />

                {/* FORM */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="container space-y-6 rounded-xl bg-white p-6 shadow">
                        
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

                            {/* SPEC NAME */}
                            <div className="flex flex-col gap-1">
                                <Label>Specification Name</Label>
                                <Input
                                    type="text"
                                    aria-invalid={!!errors.spec_name}
                                    {...register('spec_name')}
                                    placeholder="e.g., RAM, Weight, Processor"
                                />
                                {errors.spec_name && (
                                    <p className="text-sm text-destructive">
                                        {errors.spec_name.message}
                                    </p>
                                )}
                            </div>

                            {/* SPEC VALUE */}
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <Label>Specification Value</Label>
                                <Textarea
                                    aria-invalid={!!errors.spec_value}
                                    {...register('spec_value')}
                                    placeholder="e.g., 16 GB DDR5, 1.2 kg, Apple M3"
                                    rows={4}
                                />
                                {errors.spec_value && (
                                    <p className="text-sm text-destructive">
                                        {errors.spec_value.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="container flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/dashboard/ecommerce/product-specifications')}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={processing}>
                            {processing ? 'Please wait...' : 'Add Specification'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
