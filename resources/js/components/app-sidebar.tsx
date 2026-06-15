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
    const websiteMode = (props.website_mode as string) || 'commerce';
    const enabledEcommerceMenus = Array.isArray(props.enabled_ecommerce_menus)
        ? (props.enabled_ecommerce_menus as string[])
        : [];
    const dynamicContentTypes = Array.isArray(props.dynamicContentTypes)
        ? props.dynamicContentTypes
        : [];
    const resolvedSidebarConfig = sidebarConfig.map((group) => ({
        ...group,
        items: group.items.map((item) => {
            if (item.title !== 'Dynamic Content') {
                return item;
            }

            const children = dynamicContentTypes.map((contentType) => ({
                title: contentType.name,
                href: `/my-admin/dashboard/content/${contentType.slug}`,
                permission: 'dynamic-contents.view',
            }));

            return {
                ...item,
                href: children[0]?.href ?? item.href,
                children,
            };
        }),
    }));

    const menus = filterSidebar(
        resolvedSidebarConfig,
        props.auth.user,
        websiteMode,
        enabledEcommerceMenus,
    );

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
