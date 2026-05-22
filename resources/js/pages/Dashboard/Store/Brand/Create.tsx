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

const brandSchema = z.object({
    name: z.string().min(3, 'Brand name must be at least 3 characters'),
    description: z.string().nullable().optional(),
    logo: z.any().optional(),
    is_active: z.boolean().default(true),
});

type BrandFormData = z.infer<typeof brandSchema>;

export default function Create() {
    const [processing, setProcessing] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<
        z.input<typeof brandSchema>,
        unknown,
        z.output<typeof brandSchema>
    >({
        resolver: zodResolver(brandSchema),
        defaultValues: {
            is_active: true,
        },
    });

    /**
     * SUBMIT
     */
    const onSubmit = (data: BrandFormData) => {
        router.post('/dashboard/brands', data, {
            preserveScroll: true,
            onStart: () => {
                setProcessing(true);

                toast.loading('Saving brand...', {
                    id: 'save',
                });
            },

            onSuccess: () => {
                toast.success('Brand created successfully!', {
                    id: 'save',
                });
            },

            onFinish: () => {
                setProcessing(false);
            },

            onError: () => {
                toast.error(
                    'Failed to create brand. Please check the inputs.',
                    { id: 'save' },
                );
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Create Brand" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">Create Brand</h1>
                    <p className="text-muted-foreground">Add a new brand</p>
                </div>

                <hr />

                {/* FORM */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="container space-y-6 rounded-xl bg-card p-6 shadow">
                        {/* NAME */}
                        <div className="flex flex-col gap-1">
                            <Label>Brand Name</Label>
                            <Input
                                type="text"
                                aria-invalid={!!errors.name}
                                {...register('name')}
                                placeholder="e.g., Apple"
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        {/* LOGO */}
                        <div className="flex flex-col gap-1">
                            <Label>Logo</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setValue('logo', e.target.files[0]);
                                    }
                                }}
                            />
                            {errors.logo && (
                                <p className="text-sm text-destructive">
                                    {errors.logo.message as string}
                                </p>
                            )}
                        </div>

                        {/* DESCRIPTION */}
                        <div className="flex flex-col gap-1">
                            <Label>Description</Label>
                            <Textarea
                                aria-invalid={!!errors.description}
                                {...register('description')}
                                placeholder="Brand description..."
                                rows={4}
                            />
                            {errors.description && (
                                <p className="text-sm text-destructive">
                                    {errors.description.message}
                                </p>
                            )}
                        </div>

                        {/* IS ACTIVE */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_active"
                                checked={watch('is_active')}
                                onCheckedChange={(checked) =>
                                    setValue('is_active', checked as boolean)
                                }
                            />
                            <Label htmlFor="is_active">Active Status</Label>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="container flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/dashboard/brands')}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={processing}>
                            {processing ? 'Please wait...' : 'Create Brand'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
