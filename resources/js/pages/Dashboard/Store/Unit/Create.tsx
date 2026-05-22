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

const unitSchema = z.object({
    name: z.string().min(3, 'Unit name must be at least 3 characters'),
    code: z.string().min(1, 'Unit code is required').max(50, 'Unit code must not exceed 50 characters'),
    description: z.string().nullable().optional(),
    is_active: z.boolean().default(true),
});

type UnitFormData = z.infer<typeof unitSchema>;

export default function Create() {
    const [processing, setProcessing] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<
        z.input<typeof unitSchema>,
        unknown,
        z.output<typeof unitSchema>
    >({
        resolver: zodResolver(unitSchema),
        defaultValues: {
            is_active: true,
        },
    });

    /**
     * SUBMIT
     */
    const onSubmit = (data: UnitFormData) => {
        router.post('/dashboard/units', data, {
            preserveScroll: true,
            onStart: () => {
                setProcessing(true);

                toast.loading('Saving unit...', {
                    id: 'save',
                });
            },

            onSuccess: () => {
                toast.success('Unit created successfully!', {
                    id: 'save',
                });
            },

            onFinish: () => {
                setProcessing(false);
            },

            onError: () => {
                toast.error(
                    'Failed to create unit. Please check the inputs.',
                    { id: 'save' },
                );
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Create Unit" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">Create Unit</h1>
                    <p className="text-muted-foreground">Add a new product unit</p>
                </div>

                <hr />

                {/* FORM */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="container space-y-6 rounded-xl bg-card p-6 shadow">
                        {/* NAME */}
                        <div className="flex flex-col gap-1">
                            <Label>Unit Name</Label>
                            <Input
                                type="text"
                                aria-invalid={!!errors.name}
                                {...register('name')}
                                placeholder="e.g., Kilogram"
                            />
                            {errors.name && (
                                <span className="text-sm text-red-500">
                                    {errors.name.message}
                                </span>
                            )}
                        </div>

                        {/* CODE */}
                        <div className="flex flex-col gap-1">
                            <Label>Unit Code</Label>
                            <Input
                                type="text"
                                aria-invalid={!!errors.code}
                                {...register('code')}
                                placeholder="e.g., kg"
                            />
                            {errors.code && (
                                <span className="text-sm text-red-500">
                                    {errors.code.message}
                                </span>
                            )}
                        </div>

                        {/* DESCRIPTION */}
                        <div className="flex flex-col gap-1">
                            <Label>Description</Label>
                            <Textarea
                                aria-invalid={!!errors.description}
                                {...register('description')}
                                placeholder="Description of this unit (optional)"
                            />
                            {errors.description && (
                                <span className="text-sm text-red-500">
                                    {errors.description.message}
                                </span>
                            )}
                        </div>

                        {/* IS ACTIVE */}
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="is_active"
                                defaultChecked={true}
                                onCheckedChange={(checked) =>
                                    setValue('is_active', checked as boolean)
                                }
                            />
                            <Label htmlFor="is_active">Active</Label>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            disabled={processing}
                        >
                            {processing ? 'Saving...' : 'Save Unit'}
                        </Button>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => router.visit('/dashboard/units')}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
