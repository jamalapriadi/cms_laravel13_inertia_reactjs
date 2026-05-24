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

interface Brand {
    id: string;
    name: string;
    description: string | null;
    logo?: string | null;
    is_active: boolean;
}

interface Props {
    brand: Brand;
}

const brandSchema = z.object({
    name: z.string().min(3, 'Brand name must be at least 3 characters'),
    description: z.string().nullable().optional(),
    logo: z.any().optional(),
    is_active: z.boolean().default(true),
});

type BrandFormData = z.infer<typeof brandSchema>;

export default function Edit({ brand: initialBrand }: Props) {
    const [processing, setProcessing] = useState(false);

    /**
     * FORM
     */
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
            name: initialBrand.name,
            description: initialBrand.description || '',
            logo: initialBrand.logo ?? undefined,
            is_active: !!initialBrand.is_active,
        },
    });

    /**
     * TITLE
     */
    const title = 'Edit Brand';

    /**
     * SUBMIT
     */
    const onSubmit = (data: BrandFormData) => {
        const { logo, ...brandData } = data;
        const payload = logo !== undefined
            ? { ...brandData, logo }
            : brandData;

        router.post(
            `/dashboard/brands/${initialBrand.id}`,
            {
                _method: 'put',
                ...payload,
            },
            {
                forceFormData: true,
                preserveScroll: true,

                onStart: () => {
                    setProcessing(true);

                    toast.loading('Updating brand...', {
                        id: 'update',
                    });
                },

                onSuccess: () => {
                    toast.success('Brand updated successfully!', {
                        id: 'update',
                    });
                },

                onError: () => {
                    toast.error('Failed to update brand.', {
                        id: 'update',
                    });
                },

                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    return (
        <AppLayout>
            <Head title={title} />

            <div className="container mx-auto space-y-6 px-6 py-10">
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">{title}</h1>

                    <p className="text-muted-foreground">Edit brand data</p>
                </div>

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
                        <div className="flex flex-col gap-2">
                            <Label>Logo</Label>
                            <MediaImagePicker
                                value={watch('logo') as string | null}
                                onChange={(path) =>
                                    setValue('logo', path, {
                                        shouldValidate: true,
                                    })
                                }
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
                            {processing ? 'Please wait...' : 'Update Brand'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
