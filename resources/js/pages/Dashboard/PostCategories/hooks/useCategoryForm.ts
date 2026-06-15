import { zodResolver } from '@hookform/resolvers/zod';

import { router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { categorySchema } from '../schemas/category.schema';
import type { CategoryFormValues } from '../schemas/category.schema';

interface UseCategoryFormProps {
    defaultValues?: Partial<CategoryFormValues>;
    isEdit?: boolean;
    categoryId?: string;
}

export function useCategoryForm({
    defaultValues,
    isEdit = false,
    categoryId,
}: UseCategoryFormProps = {}) {
    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            category_name: '',
            description: '',
            parent_id: '',
            featured_image: '',
            ...defaultValues,
        },
    });

    const onSubmit = (values: CategoryFormValues) => {
        if (isEdit && categoryId) {
            router.put(
                `/my-admin/dashboard/post-categories/${categoryId}`,
                values,
                {
                    preserveScroll: true,

                    onStart: () =>
                        toast.loading('Updating...', { id: 'category' }),
                    onSuccess: () =>
                        toast.success('Category updated successfully', {
                            id: 'category',
                        }),
                    onError: () =>
                        toast.error('Failed to update category', {
                            id: 'category',
                        }),
                },
            );
        } else {
            router.post('/my-admin/dashboard/post-categories', values, {
                preserveScroll: true,

                onStart: () => toast.loading('Saving...', { id: 'category' }),
                onSuccess: () =>
                    toast.success('Category created successfully', {
                        id: 'category',
                    }),
                onError: () =>
                    toast.error('Failed to create category', {
                        id: 'category',
                    }),
            });
        }
    };

    return {
        form,
        onSubmit,
    };
}
