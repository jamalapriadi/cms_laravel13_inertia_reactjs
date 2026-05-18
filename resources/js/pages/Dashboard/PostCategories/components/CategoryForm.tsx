import { Controller } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Textarea from '@/components/ui/textarea';
import { useCategoryForm } from '../hooks/useCategoryForm';

interface Category {
    id: string;
    category_name: string;
    description?: string;
    parent_id?: string;
}

interface Props {
    parents: Category[];
    defaultValues?: Partial<Category>;
    isEdit?: boolean;
    categoryId?: string;
}

export default function CategoryForm({
    parents,
    defaultValues,
    isEdit = false,
    categoryId,
}: Props) {
    const { form, onSubmit } = useCategoryForm({
        defaultValues,
        isEdit,
        categoryId,
    });

    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = form;

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {isEdit ? 'Edit Category' : 'Category Form'}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* NAME */}
                    <div className="space-y-2">
                        <Label>Name</Label>

                        <Input {...register('category_name')} />

                        {errors.category_name && (
                            <p className="text-sm text-destructive">
                                {errors.category_name.message}
                            </p>
                        )}
                    </div>

                    {/* PARENT */}
                    <div className="space-y-2">
                        <Label>Parent</Label>

                        <Controller
                            control={control}
                            name="parent_id"
                            render={({ field }) => (
                                <Select
                                    value={field.value || 'none'}
                                    onValueChange={(val) =>
                                        field.onChange(
                                            val === 'none' ? '' : val,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="None" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="none">
                                            None
                                        </SelectItem>

                                        {parents.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.category_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    {/* DESCRIPTION */}
                    <div className="space-y-2">
                        <Label>Description</Label>

                        <Textarea {...register('description')} />

                        {errors.description && (
                            <p className="text-sm text-destructive">
                                {errors.description.message}
                            </p>
                        )}
                    </div>

                    {/* ACTION */}
                    <div className="flex justify-between">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => window.history.back()}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? isEdit
                                    ? 'Updating...'
                                    : 'Saving...'
                                : isEdit
                                  ? 'Update'
                                  : 'Save'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
