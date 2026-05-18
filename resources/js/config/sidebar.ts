import {
    LayoutGrid,
    Settings,
    Menu,
    Image,
    FileText,
    FolderTree,
    Tags,
} from 'lucide-react';

export interface SidebarItem {
    title: string;
    href: string;
    icon?: React.ElementType;
    permission?: string; // 🔥 pakai permission, bukan role
}

export interface SidebarGroup {
    label: string;
    items: SidebarItem[];
}

export const sidebarConfig: SidebarGroup[] = [
    {
        label: 'Main',
        items: [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutGrid,
            },
        ],
    },

    {
        label: 'Blogs',
        items: [
            {
                title: 'Posts',
                href: '/dashboard/posts',
                icon: FileText,
                permission: 'post.view',
            },
            {
                title: 'Categories',
                href: '/dashboard/post-categories',
                icon: FolderTree,
                permission: 'category.manage',
            },
            {
                title: 'Tags',
                href: '/dashboard/taxonomies/tags',
                icon: Tags,
                permission: 'taxonomy.manage',
            },
        ],
    },

    {
        label: 'Settings',
        items: [
            {
                title: 'Media',
                href: '/dashboard/media',
                icon: Image,
                permission: 'settings.manage',
            },
            {
                title: 'Menus',
                href: '/dashboard/menus',
                icon: Menu,
                permission: 'settings.manage',
            },
            {
                title: 'General Settings',
                href: '/dashboard/config/main',
                icon: Settings,
                permission: 'settings.manage',
            },
        ],
    },
];
