import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import SearchableSelect from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';

import AppLayout from '@/layouts/master-data-layout';

interface Product {
    id: string;
    name: string;
}

interface ProductSpecification {
    id: string;
    product_id: string;
    spec_name: string;
    spec_value?: string | null;
}

interface Props {
    specification: ProductSpecification;
    products: Product[];
}

const specSchema = z.object({
    product_id: z.string().min(1, 'Product is required'),
    spec_name: z.string().min(1, 'Specification name is required'),
    spec_value: z.string().min(1, 'Specification value is required'),
});

type SpecFormData = z.infer<typeof specSchema>;

export default function Edit({ specification: initialSpec, products }: Props) {
    const [processing, setProcessing] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<
        z.input<typeof specSchema>,
        unknown,
        z.output<typeof specSchema>
    >({
        resolver: zodResolver(specSchema),
        defaultValues: {
            product_id: initialSpec.product_id,
            spec_name: initialSpec.spec_name,
            spec_value: initialSpec.spec_value || '',
        },
    });

    /**
     * SUBMIT
     */
    const onSubmit = (data: SpecFormData) => {
        router.put(
            `/my-admin/dashboard/ecommerce/product-specifications/${initialSpec.id}`,
            data,
            {
                preserveScroll: true,
                onStart: () => {
                    setProcessing(true);
                    toast.loading('Updating specification...', {
                        id: 'update',
                    });
                },
                onSuccess: () => {
                    toast.success('Specification updated successfully!', {
                        id: 'update',
                    });
                },
                onFinish: () => {
                    setProcessing(false);
                },
                onError: () => {
                    toast.error(
                        'Failed to update specification. Please check the inputs.',
                        { id: 'update' },
                    );
                },
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Edit Product Specification" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">
                        Edit Product Specification
                    </h1>
                    <p className="text-muted-foreground">
                        Edit details for this specification
                    </p>
                </div>

                <hr />

                {/* FORM */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="container space-y-6 rounded-xl bg-card p-6 shadow">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* PRODUCT */}
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <Label>Product</Label>
                                <SearchableSelect
                                    options={products.map((product) => ({
                                        value: product.id,
                                        label: product.name,
                                    }))}
                                    value={watch('product_id')}
                                    onChange={(value) =>
                                        setValue('product_id', value ?? '', {
                                            shouldValidate: true,
                                        })
                                    }
                                    placeholder="-- Select Product --"
                                    error={errors.product_id?.message}
                                />
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
                            onClick={() =>
                                router.visit(
                                    '/my-admin/dashboard/ecommerce/product-specifications',
                                )
                            }
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={processing}>
                            {processing
                                ? 'Please wait...'
                                : 'Update Specification'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
