import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebarHeader breadcrumbs={breadcrumbs} />

            <div className={`flex`}>
                <AppSidebar />
                <AppContent
                    variant="sidebar"
                    className="overflow-x-hidden bg-muted/50"
                >
                    <div className={`p-4`}>{children}</div>
                </AppContent>
            </div>
        </AppShell>
    );
}
