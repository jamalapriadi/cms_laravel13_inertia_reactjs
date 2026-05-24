import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid } from 'lucide-react';

import SidebarGroupItem from '@/components/sidebar-group';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes/customer';
import { CustomerNavUser } from './customer-nav-user';

const menus = [
    {
        label: 'Customer',
        items: [
            {
                title: 'Dashboard',
                href: dashboard().url,
                icon: LayoutGrid,
            },
        ],
    },
];

export function CustomerSidebar() {
    const { url } = usePage();

    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
            className="border-r border-border bg-card pt-20"
        >
            <SidebarContent className="bg-card">
                {menus.map((group) => (
                    <SidebarGroupItem key={group.label} label={group.label}>
                        {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = url.startsWith(item.href);

                            return (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                        className={cn(
                                            isActive &&
                                                'bg-muted font-semibold text-foreground',
                                        )}
                                    >
                                        <Link
                                            href={item.href}
                                            className="flex items-center gap-2"
                                        >
                                            <Icon className="size-4" />
                                            <span className="text-xs">
                                                {item.title}
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarGroupItem>
                ))}
            </SidebarContent>

            <SidebarFooter className="bg-card">
                <SidebarSeparator className="my-2" />
                <CustomerNavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
