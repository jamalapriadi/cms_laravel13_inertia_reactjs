import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import Textarea from '@/components/ui/textarea';

// import AppLayout from '@/layouts/master-data-layout';

const supplierSchema = z.object({
    name: z.string().min(3, 'Supplier name must be at least 3 characters'),
    code: z.string().min(2, 'Supplier code must be at least 2 characters'),
    phone: z.string().nullable().optional(),
    email: z
        .string()
        .email('Invalid email address')
        .or(z.literal(''))
        .nullable()
        .optional(),
    address: z.string().nullable().optional(),
    is_active: z.boolean().default(true),
});

type SupplierFormInput = z.input<typeof supplierSchema>;
type SupplierFormData = z.output<typeof supplierSchema>;

interface Props {
    supplier: {
        id: string;
        name: string;
        code: string;
        phone?: string | null;
        email?: string | null;
        address?: string | null;
        is_active: boolean;
    };
}

export default function Edit({ supplier }: Props) {
    const [processing, setProcessing] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<SupplierFormInput, unknown, SupplierFormData>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            name: supplier.name,
            code: supplier.code,
            phone: supplier.phone || '',
            email: supplier.email || '',
            address: supplier.address || '',
            is_active: supplier.is_active,
        },
    });

    const onSubmit = (data: SupplierFormData) => {
        router.put(`/my-admin/dashboard/ecommerce/suppliers/${supplier.id}`, data, {
            preserveScroll: true,
            onStart: () => {
                setProcessing(true);
                toast.loading('Saving supplier...', { id: 'save' });
            },
            onSuccess: () => {
                toast.success('Supplier updated successfully!', { id: 'save' });
            },
            onFinish: () => {
                setProcessing(false);
            },
            onError: () => {
                toast.error(
                    'Failed to update supplier. Please check the inputs.',
                    { id: 'save' },
                );
            },
        });
    };

    return (
        <>
            <Head title="Edit Supplier" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                {/* HEADER */}
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                            router.visit('/my-admin/dashboard/ecommerce/suppliers')
                        }
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Edit Supplier
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Modify supplier details
                        </p>
                    </div>
                </div>

                <hr className="border-border" />

                {/* FORM */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
                        {/* NAME */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="name">Supplier Name</Label>
                            <Input
                                id="name"
                                type="text"
                                aria-invalid={!!errors.name}
                                {...register('name')}
                                placeholder="e.g., PT. Jaya Abadi"
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        {/* CODE */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="code">Supplier Code</Label>
                            <Input
                                id="code"
                                type="text"
                                aria-invalid={!!errors.code}
                                {...register('code')}
                                placeholder="e.g., SPL-JAYA"
                            />
                            {errors.code && (
                                <p className="text-xs text-destructive">
                                    {errors.code.message}
                                </p>
                            )}
                        </div>

                        {/* PHONE */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="text"
                                aria-invalid={!!errors.phone}
                                {...register('phone')}
                                placeholder="e.g., 08123456789"
                            />
                            {errors.phone && (
                                <p className="text-xs text-destructive">
                                    {errors.phone.message}
                                </p>
                            )}
                        </div>

                        {/* EMAIL */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="text"
                                aria-invalid={!!errors.email}
                                {...register('email')}
                                placeholder="e.g., supplier@example.com"
                            />
                            {errors.email && (
                                <p className="text-xs text-destructive">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* ADDRESS */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                aria-invalid={!!errors.address}
                                {...register('address')}
                                placeholder="Supplier office/warehouse address..."
                                rows={4}
                            />
                            {errors.address && (
                                <p className="text-xs text-destructive">
                                    {errors.address.message}
                                </p>
                            )}
                        </div>

                        {/* IS ACTIVE */}
                        <div className="flex items-center space-x-2 pt-2">
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
                    <div className="flex justify-between gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.visit('/my-admin/dashboard/ecommerce/suppliers')
                            }
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Update Supplier'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
