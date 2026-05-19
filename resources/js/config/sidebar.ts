import {
    LayoutGrid,
    Settings,
    Menu,
    Image,
    FileText,
    FolderTree,
    Tags,
    ShoppingBag,
    Package,
    Boxes,
    ClipboardList,
    BadgeDollarSign,
    Warehouse,
    Truck,
    ShoppingCart,
} from 'lucide-react';

export interface SidebarItem {
    title: string;
    href: string;
    icon?: React.ElementType;
    permission?: string;
}

export interface SidebarGroup {
    label: string;
    items: SidebarItem[];
}

export const sidebarConfig: SidebarGroup[] = [
    /*
    |--------------------------------------------------------------------------
    | Main
    |--------------------------------------------------------------------------
    */
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

    /*
    |--------------------------------------------------------------------------
    | Blogs
    |--------------------------------------------------------------------------
    */
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

    /*
    |--------------------------------------------------------------------------
    | Ecommerce
    |--------------------------------------------------------------------------
    */
    {
        label: 'Ecommerce',
        items: [
            {
                title: 'Brands',
                href: '/dashboard/brands',
                icon: BadgeDollarSign,
                permission: 'brand.view',
            },
            {
                title: 'Product Categories',
                href: '/dashboard/ecommerce/categories',
                icon: FolderTree,
                permission: 'product-category.view',
            },
            {
                title: 'Products',
                href: '/dashboard/ecommerce/products',
                icon: Package,
                permission: 'product.view',
            },
            {
                title: 'Product Variants',
                href: '/dashboard/ecommerce/product-variants',
                icon: Boxes,
                permission: 'product-variant.view',
            },
            {
                title: 'Orders',
                href: '/dashboard/ecommerce/orders',
                icon: ClipboardList,
                permission: 'order.view',
            },
            {
                title: 'Carts',
                href: '/dashboard/ecommerce/carts',
                icon: ShoppingCart,
                permission: 'cart.view',
            },
            {
                title: 'Payments',
                href: '/dashboard/ecommerce/payments',
                icon: ShoppingBag,
                permission: 'payment.view',
            },
            {
                title: 'Stock Movements',
                href: '/dashboard/ecommerce/stock-movements',
                icon: Warehouse,
                permission: 'stock-movement.view',
            },
            {
                title: 'Shipping',
                href: '/dashboard/ecommerce/shipping',
                icon: Truck,
                permission: 'shipping.view',
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | Settings
    |--------------------------------------------------------------------------
    */
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
