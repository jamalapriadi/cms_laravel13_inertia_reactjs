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
    // Hide ecommerce items based on website mode
    if (item.isEcommerce) {
        if (websiteMode === 'blog') {
            return null;
        }

        if (websiteMode === 'simple_blog_commerce') {
            // Only show if the item's key is explicitly enabled
            if (!item.key || !enabledEcommerceMenus.includes(item.key)) {
                return null;
            }
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
        // Fallback for items with explicitly empty children array like Dynamic Content
        if (item.children !== undefined && item.children.length === 0) {
            return item;
        }
        // Normal item with no children defined
        if (item.children === undefined) {
            return item;
        }
    }

    return null;
}
