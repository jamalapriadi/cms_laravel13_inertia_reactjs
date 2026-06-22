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
import TinyEditor from '@/components/ui/TinyEditor';

import AppLayout from '@/layouts/master-data-layout';

interface CategoryOption {
    id: string;
    name: string;
}

interface Props {
    categories: CategoryOption[];
}

const categorySchema = z.object({
    name: z.string().min(3, 'Category name must be at least 3 characters'),
    slug: z.string().optional().or(z.literal('')),
    parent_id: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    image: z.any().optional(),
    sort_order: z.coerce.number().min(0).default(0),
    show_home: z.boolean().default(false),
    is_publish: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function Create({ categories }: Props) {
    const [processing, setProcessing] = useState(false);

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
            parent_id: null,
            slug: '',
            description: '',
            sort_order: 0,
            show_home: false,
            is_publish: true,
        },
    });

    const name = watch('name');

    useEffect(() => {
        const slugified = (name || '')
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
        setValue('slug', slugified);
    }, [name, setValue]);

    /**
     * SUBMIT
     */
    const onSubmit = (data: CategoryFormData) => {
        router.post('/my-admin/dashboard/ecommerce/categories', data, {
            preserveScroll: true,
            onStart: () => {
                setProcessing(true);

                toast.loading('Saving category...', {
                    id: 'save',
                });
            },

            onSuccess: () => {
                toast.success('Category created successfully!', {
                    id: 'save',
                });
            },

            onFinish: () => {
                setProcessing(false);
            },

            onError: () => {
                toast.error(
                    'Failed to create category. Please check the inputs.',
                    { id: 'save' },
                );
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Create Category" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">Create Category</h1>
                    <p className="text-muted-foreground">
                        Add a new product category
                    </p>
                </div>

                <hr />

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

                        {/* SLUG */}
                        <div className="flex flex-col gap-1">
                            <Label>Slug</Label>
                            <Input
                                type="text"
                                readOnly
                                className="bg-muted pointer-events-none select-none"
                                {...register('slug')}
                                placeholder="slug-category"
                            />
                            <p className="text-xs text-muted-foreground">
                                Slug will be generated automatically after saving.
                            </p>
                            {errors.slug && (
                                <p className="text-sm text-destructive">
                                    {errors.slug.message}
                                </p>
                            )}
                        </div>

                        {/* DESCRIPTION */}
                        <div className="flex flex-col gap-1">
                            <Label>Description</Label>
                            <TinyEditor
                                value={watch('description') || ''}
                                onChange={(val) =>
                                    setValue('description', val, {
                                        shouldValidate: true,
                                    })
                                }
                            />
                            {errors.description && (
                                <p className="text-sm text-destructive">
                                    {errors.description.message}
                                </p>
                            )}
                        </div>

                        {/* PARENT CATEGORY */}
                        <div className="flex flex-col gap-1">
                            <Label>Parent Category</Label>
                            <SearchableSelect
                                options={categories.map((cat) => ({
                                    value: cat.id,
                                    label: cat.name,
                                }))}
                                value={watch('parent_id') ?? ''}
                                onChange={(value) =>
                                    setValue('parent_id', value || null, {
                                        shouldValidate: true,
                                    })
                                }
                                placeholder="-- None (Top Level) --"
                                error={errors.parent_id?.message}
                                clearable
                            />
                        </div>

                        {/* IMAGE */}
                        <div className="flex flex-col gap-1">
                            <Label>Image</Label>
                            <MediaImagePicker
                                value={watch('image') as string | null}
                                onChange={(path) =>
                                    setValue('image', path, {
                                        shouldValidate: true,
                                    })
                                }
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
                            onClick={() =>
                                router.visit(
                                    '/my-admin/dashboard/ecommerce/categories',
                                )
                            }
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={processing}>
                            {processing ? 'Please wait...' : 'Create Category'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
