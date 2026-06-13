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
    ClipboardList,
    BadgeDollarSign,
    Warehouse,
    Truck,
    ShoppingCart,
    ScanBarcode,
    Users,
    ArrowDownLeft,
    ArrowUpRight,
    CircleHelp,
    RssIcon,
    ShieldCheck,
    KeyRound,
    StickyNote,
} from 'lucide-react';

export interface SidebarItem {
    title: string;
    href: string;
    icon?: React.ElementType;
    permission?: string;
    target?: '_blank' | '_self';
    rel?: string;
    children?: SidebarItem[];
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
                href: '/my-admin/dashboard',
                icon: LayoutGrid,
                permission: 'dashboard.view',
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | Blogs
    |--------------------------------------------------------------------------
    */
    {
        label: 'Frontend',
        items: [
            {
                title: 'Posts',
                href: '/my-admin/dashboard/posts',
                icon: FileText,
                permission: 'posts.view',
                children: [
                    {
                        title: 'All Posts',
                        href: '/my-admin/dashboard/posts',
                        icon: FileText,
                        permission: 'posts.view',
                    },
                    {
                        title: 'Categories',
                        href: '/my-admin/dashboard/post-categories',
                        icon: FolderTree,
                        permission: 'post-categories.view',
                    },
                    {
                        title: 'Tags',
                        href: '/my-admin/dashboard/taxonomies/tags',
                        icon: Tags,
                        permission: 'taxonomies.view',
                    },
                ],
            },
            {
                title: 'Pages',
                href: '/my-admin/dashboard/pages',
                icon: StickyNote,
                permission: 'pages.view',
            },
            {
                title: 'Dynamic Content',
                href: '/my-admin/dashboard/content-types',
                icon: FileText,
                permission: 'dynamic-contents.view',
                children: [],
            },
            {
                title: 'Promo',
                href: '/my-admin/dashboard/ecommerce/product-collections',
                icon: BadgeDollarSign,
                permission: 'product-collections.view',
                children: [
                    {
                        title: 'Product Collections',
                        href: '/my-admin/dashboard/ecommerce/product-collections',
                        permission: 'product-collections.view',
                    },
                    {
                        title: 'Best Seller',
                        href: '/my-admin/dashboard/ecommerce/product-collections?type=best_seller',
                        permission: 'product-collections.view',
                    },
                    {
                        title: 'Exclusive Deals',
                        href: '/my-admin/dashboard/ecommerce/product-collections?type=exclusive_deals',
                        permission: 'product-collections.view',
                    },
                    {
                        title: 'Big Sale',
                        href: '/my-admin/dashboard/ecommerce/product-collections?type=big_sale',
                        permission: 'product-collections.view',
                    },
                    {
                        title: 'Flash Sale',
                        href: '/my-admin/dashboard/ecommerce/product-collections?type=flash_sale',
                        permission: 'product-collections.view',
                    },
                    {
                        title: 'Promo Lainnya',
                        href: '/my-admin/dashboard/ecommerce/product-collections?type=promo',
                        permission: 'product-collections.view',
                    },
                ],
            },
            {
                title: 'Banner Slides',
                href: '/my-admin/dashboard/ecommerce/banner-slides',
                icon: Image,
                permission: 'banner-slides.view',
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
                title: 'Products',
                href: '/my-admin/dashboard/ecommerce/products',
                icon: Package,
                permission: 'products.view',
            },
            {
                title: 'Stok Unit',
                href: '/my-admin/dashboard/ecommerce/product-stock-units',
                icon: ScanBarcode,
                permission: 'product-stock-units.view',
            },

            {
                title: 'Orders',
                href: '/my-admin/dashboard/orders',
                icon: ClipboardList,
                permission: 'orders.view',
            },
            {
                title: 'Customers',
                href: '/my-admin/dashboard/ecommerce/customers',
                icon: Users,
                permission: 'customers.view',
            },
            {
                title: 'Carts',
                href: '/my-admin/dashboard/ecommerce/carts',
                icon: ShoppingCart,
                permission: 'carts.view',
            },
            {
                title: 'Payments',
                href: '/my-admin/dashboard/ecommerce/payments',
                icon: ShoppingBag,
                permission: 'payments.view',
            },
            {
                title: 'Stock Movements',
                href: '/my-admin/dashboard/ecommerce/stock-movements',
                icon: Warehouse,
                permission: 'stock-movements.view',
            },
            {
                title: 'Shipping',
                href: '/my-admin/dashboard/ecommerce/shipping',
                icon: Truck,
                permission: 'shippings.view',
            },
            {
                title: 'Suppliers',
                href: '/my-admin/dashboard/ecommerce/suppliers',
                icon: Users,
                permission: 'suppliers.view',
            },
            {
                title: 'Barang Masuk',
                href: '/my-admin/dashboard/ecommerce/incoming-goods',
                icon: ArrowDownLeft,
                permission: 'incoming-goods.view',
            },
            {
                title: 'Retur Barang',
                href: '/my-admin/dashboard/ecommerce/supplier-returns',
                icon: ArrowUpRight,
                permission: 'supplier-returns.view',
            },
        ],
    },

    {
        label: 'Management',
        items: [
            {
                title: 'Users',
                href: '/my-admin/dashboard/users',
                icon: Users,
                permission: 'users.view',
            },
            {
                title: 'Roles',
                href: '/my-admin/dashboard/roles',
                icon: ShieldCheck,
                permission: 'roles.view',
            },
            {
                title: 'Permissions',
                href: '/my-admin/dashboard/permissions',
                icon: KeyRound,
                permission: 'permissions.view',
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
                href: '/my-admin/dashboard/media',
                icon: Image,
                permission: 'media.view',
            },
            {
                title: 'Menus',
                href: '/my-admin/dashboard/menus',
                icon: Menu,
                permission: 'menus.view',
            },
            {
                title: 'FAQ',
                href: '/my-admin/dashboard/ecommerce/faqs',
                icon: CircleHelp,
                permission: 'faqs.view',
            },
            {
                title: 'Site Contents',
                href: '/my-admin/dashboard/config/site-contents',
                icon: RssIcon,
                permission: 'site-contents.view',
            },
            {
                title: 'Content Builder',
                href: '/my-admin/dashboard/content-types',
                icon: FolderTree,
                permission: 'content-types.view',
                children: [
                    {
                        title: 'Content Types',
                        href: '/my-admin/dashboard/content-types',
                        permission: 'content-types.view',
                    },
                    {
                        title: 'Custom Fields',
                        href: '/my-admin/dashboard/custom-fields',
                        permission: 'custom-fields.view',
                    },
                ],
            },
            {
                title: 'API Documentation',
                href: '/api/documentation',
                icon: FileText,
                permission: 'api-documentation.view',
                target: '_blank',
                rel: 'noopener noreferrer',
            },
            {
                title: 'General Settings',
                href: '/my-admin/dashboard/config/main',
                icon: Settings,
                permission: 'settings.view',
            },
        ],
    },
];
