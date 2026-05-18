import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/master-data-layout';
import { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Settings',
        href: '/dashboard/settings',
    },
    {
        title: 'Management',
        href: '/dashboard/settings/management',
    },
];

export default function Management() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Management" />

            <div className="container mx-auto px-6 py-6"></div>
        </AppLayout>
    );
}
