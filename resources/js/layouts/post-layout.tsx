import { Link, usePage } from '@inertiajs/react';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

export default function PostLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            <div className="flex">{children}</div>
        </AppLayoutTemplate>
    );
}

/**
 * ✅ Layout (konsisten semua halaman config)
 */
PostLayout.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan',
            href: '/dashboard/config/main',
        },
        {
            title: 'Wilayah',
            href: '#',
        },
    ],
};
