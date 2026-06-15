import type { SidebarGroup, SidebarItem } from '@/config/sidebar';
import { hasPermission, type PermissionUser } from '@/lib/permissions';

export function filterSidebar(
    config: SidebarGroup[],
    user: PermissionUser,
    websiteMode: string = 'commerce',
    enabledEcommerceMenus: string[] = [],
): SidebarGroup[] {
    return config
        .map((group) => {
            // Hide the entire Ecommerce group if in blog mode
            if (websiteMode === 'blog' && group.label === 'Ecommerce') {
                return null;
            }

            const items = group.items
                .map((item) =>
                    filterSidebarItem(
                        item,
                        user,
                        websiteMode,
                        enabledEcommerceMenus,
                    ),
                )
                .filter((item): item is SidebarItem => item !== null);

            return {
                ...group,
                items,
            };
        })
        .filter(
            (group): group is SidebarGroup =>
                group !== null && group.items.length > 0,
        );
}

function filterSidebarItem(
    item: SidebarItem,
    user: PermissionUser,
    websiteMode: string,
    enabledEcommerceMenus: string[],
): SidebarItem | null {
    // If simple blog commerce mode, only show allowed ecommerce keys
    if (websiteMode === 'simple_blog_commerce' && item.key) {
        if (!enabledEcommerceMenus.includes(item.key)) {
            return null;
        }
    }

    const children = item.children
        ?.map((child) =>
            filterSidebarItem(child, user, websiteMode, enabledEcommerceMenus),
        )
        .filter((child): child is SidebarItem => child !== null);

    if (children && children.length > 0) {
        return {
            ...item,
            children,
        };
    }

    if (hasPermission(user, item.permission)) {
        return item;
    }

    return null;
}
