import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { CustomerSidebar } from '@/components/customer/customer-sidebar';
import { CustomerSidebarHeader } from '@/components/customer/customer-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function CustomerSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <CustomerSidebarHeader breadcrumbs={breadcrumbs} />

            <div className="flex">
                <CustomerSidebar />
                <AppContent
                    variant="sidebar"
                    className="overflow-x-hidden bg-muted/50"
                >
                    <div className="p-4">{children}</div>
                </AppContent>
            </div>
        </AppShell>
    );
}
