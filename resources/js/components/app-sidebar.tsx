import { usePage } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import { NavUser } from '@/components/nav-user';

import SidebarGroupItem from '@/components/sidebar-group';
import SidebarItem from '@/components/sidebar-item';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarSeparator,
} from '@/components/ui/sidebar';

import { sidebarConfig } from '@/config/sidebar';
import { filterSidebar } from '@/utils/sidebar';

export function AppSidebar() {
    const { url, props } = usePage();

    // ✅ ambil role dari user (dari Laravel)
    const role = props.auth?.user?.role || 'editor';

    const menus = filterSidebar(sidebarConfig, role);

    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
            className={`border-r border-border bg-card pt-20`}
        >
            {/* CONTENT */}
            <SidebarContent className={`bg-card`}>
                {menus.map((group) => (
                    <SidebarGroupItem key={group.label} label={group.label}>
                        {group.items.map((item: any) => (
                            <SidebarItem
                                key={item.href}
                                item={item}
                                url={url}
                            />
                        ))}
                    </SidebarGroupItem>
                ))}
            </SidebarContent>

            {/* FOOTER */}
            <SidebarFooter className={`bg-card`}>
                <SidebarSeparator className="my-2" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
