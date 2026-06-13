import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import CategoryForm from './components/CategoryForm';

interface Category {
    id: string;
    category_name: string;
    description?: string;
    parent_id?: string;
}

export default function Edit({
    category,
    parents,
}: {
    category: Category;
    parents: Category[];
}) {
    return (
        <>
            <Head title="Edit Category" />

            <div className="container mx-auto space-y-8 px-6 py-10">
                <div>
                    <h1 className="text-3xl font-bold">Edit Category</h1>
                    <p className="text-muted-foreground">
                        Update category information
                    </p>
                </div>

                <CategoryForm
                    parents={parents}
                    isEdit
                    categoryId={category.id}
                    defaultValues={{
                        category_name: category.category_name,
                        description: category.description,
                        parent_id: category.parent_id,
                    }}
                />
            </div>
        </>
    );
}

Edit.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            {
                title: 'Post Categories',
                href: '/my-admin/dashboard/post-categories',
            },
            {
                title: 'Edit',
                href: '#',
            },
        ]}
    >
        {page}
    </AppLayout>
);
