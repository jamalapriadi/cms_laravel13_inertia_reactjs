import CustomerSidebarLayout from '@/layouts/customer/customer-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

export default function CustomerDashboardLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    return (
        <CustomerSidebarLayout breadcrumbs={breadcrumbs}>
            {children}
        </CustomerSidebarLayout>
    );
}
