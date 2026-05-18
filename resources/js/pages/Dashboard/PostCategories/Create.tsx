import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import CategoryForm from './components/CategoryForm';

export default function Create({ parents }: any) {
    return (
        <>
            <Head title="Create Category" />

            <div className="container mx-auto space-y-8 px-6 py-10">
                <div>
                    <h1 className="text-3xl font-bold">Create Category</h1>
                    <p className="text-muted-foreground">Add a new category</p>
                </div>

                <CategoryForm parents={parents} />
            </div>
        </>
    );
}

Create.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            {
                title: 'Post Categories',
                href: '/dashboard/post-categories',
            },
            {
                title: 'Create',
                href: '/dashboard/post-categories/create',
            },
        ]}
    >
        {page}
    </AppLayout>
);
