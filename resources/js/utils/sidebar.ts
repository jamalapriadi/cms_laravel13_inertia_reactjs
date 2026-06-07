import type { SidebarGroup, SidebarItem } from '@/config/sidebar';
import { hasPermission, type PermissionUser } from '@/lib/permissions';

export function filterSidebar(
    config: SidebarGroup[],
    user: PermissionUser,
): SidebarGroup[] {
    return config
        .map((group) => {
            const items = group.items
                .map((item) => filterSidebarItem(item, user))
                .filter((item): item is SidebarItem => item !== null);

            return {
                ...group,
                items,
            };
        })
        .filter((group) => group.items.length > 0);
}

function filterSidebarItem(
    item: SidebarItem,
    user: PermissionUser,
): SidebarItem | null {
    const children = item.children
        ?.map((child) => filterSidebarItem(child, user))
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
