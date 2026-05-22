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

interface CategoryOption {
    id: string;
    name: string;
}

interface Category {
    id: string;
    parent_id: string | null;
    name: string;
    image?: string | null;
    sort_order: number;
    show_home: boolean;
    is_publish: boolean;
}

interface Props {
    category: Category;
    categories: CategoryOption[];
}

const categorySchema = z.object({
    name: z.string().min(3, 'Category name must be at least 3 characters'),
    parent_id: z.string().nullable().optional(),
    image: z.any().optional(),
    sort_order: z.coerce.number().min(0).default(0),
    show_home: z.boolean().default(false),
    is_publish: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function Edit({ category: initialCategory, categories }: Props) {
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
        z.input<typeof categorySchema>,
        unknown,
        z.output<typeof categorySchema>
    >({
        resolver: zodResolver(categorySchema),

        defaultValues: {
            name: initialCategory.name,
            parent_id: initialCategory.parent_id || null,
            sort_order: initialCategory.sort_order,
            show_home: !!initialCategory.show_home,
            is_publish: !!initialCategory.is_publish,
        },
    });

    /**
     * TITLE
     */
    const title = 'Edit Category';

    /**
     * SUBMIT
     */
    const onSubmit = (data: CategoryFormData) => {
        router.post(
            `/dashboard/ecommerce/categories/${initialCategory.id}`,
            {
                _method: 'put',
                ...data,
            },
            {
                preserveScroll: true,

                onStart: () => {
                    setProcessing(true);

                    toast.loading('Updating category...', {
                        id: 'update',
                    });
                },

                onSuccess: () => {
                    toast.success('Category updated successfully!', {
                        id: 'update',
                    });
                },

                onError: () => {
                    toast.error('Failed to update category.', {
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

                    <p className="text-muted-foreground">Edit product category data</p>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="container space-y-6 rounded-xl bg-card p-6 shadow">
                        {/* NAME */}
                        <div className="flex flex-col gap-1">
                            <Label>Category Name</Label>
                            <Input
                                type="text"
                                aria-invalid={!!errors.name}
                                {...register('name')}
                                placeholder="e.g., Electronics"
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        {/* PARENT CATEGORY */}
                        <div className="flex flex-col gap-1">
                            <Label>Parent Category</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...register('parent_id')}
                                onChange={(e) => {
                                    setValue('parent_id', e.target.value === '' ? null : e.target.value);
                                }}
                            >
                                <option value="">-- None (Top Level) --</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {errors.parent_id && (
                                <p className="text-sm text-destructive">
                                    {errors.parent_id.message}
                                </p>
                            )}
                        </div>

                        {/* IMAGE */}
                        <div className="flex flex-col gap-2">
                            <Label>Image</Label>
                            
                            {initialCategory.image && (
                                <div>
                                    <img 
                                        src={`/storage/${initialCategory.image}`} 
                                        alt="Category Image" 
                                        className="h-32 w-32 rounded-lg border bg-muted object-contain p-1" 
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">Current image. Upload a new file to replace it.</p>
                                </div>
                            )}

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
                                placeholder="e.g., 0"
                                min="0"
                            />
                            {errors.sort_order && (
                                <p className="text-sm text-destructive">
                                    {errors.sort_order.message}
                                </p>
                            )}
                        </div>

                        {/* SHOW HOME */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="show_home"
                                checked={watch('show_home')}
                                onCheckedChange={(checked) =>
                                    setValue('show_home', checked as boolean)
                                }
                            />
                            <Label htmlFor="show_home">Show on Homepage</Label>
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
                            <Label htmlFor="is_publish">Published Status</Label>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="container flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/dashboard/ecommerce/categories')}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={processing}>
                            {processing ? 'Please wait...' : 'Update Category'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
