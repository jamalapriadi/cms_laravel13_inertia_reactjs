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
                href: '/dashboard',
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
                href: '/dashboard/posts',
                icon: FileText,
                permission: 'posts.view',
                children: [
                    {
                        title: 'All Posts',
                        href: '/dashboard/posts',
                        icon: FileText,
                        permission: 'posts.view',
                    },
                    {
                        title: 'Categories',
                        href: '/dashboard/post-categories',
                        icon: FolderTree,
                        permission: 'post-categories.view',
                    },
                    {
                        title: 'Tags',
                        href: '/dashboard/taxonomies/tags',
                        icon: Tags,
                        permission: 'taxonomies.view',
                    },
                ],
            },
            {
                title: 'Promo',
                href: '/dashboard/ecommerce/product-collections',
                icon: BadgeDollarSign,
                permission: 'product-collections.view',
                children: [
                    {
                        title: 'Product Collections',
                        href: '/dashboard/ecommerce/product-collections',
                        permission: 'product-collections.view',
                    },
                    {
                        title: 'Best Seller',
                        href: '/dashboard/ecommerce/product-collections?type=best_seller',
                        permission: 'product-collections.view',
                    },
                    {
                        title: 'Exclusive Deals',
                        href: '/dashboard/ecommerce/product-collections?type=exclusive_deals',
                        permission: 'product-collections.view',
                    },
                    {
                        title: 'Big Sale',
                        href: '/dashboard/ecommerce/product-collections?type=big_sale',
                        permission: 'product-collections.view',
                    },
                    {
                        title: 'Flash Sale',
                        href: '/dashboard/ecommerce/product-collections?type=flash_sale',
                        permission: 'product-collections.view',
                    },
                    {
                        title: 'Promo Lainnya',
                        href: '/dashboard/ecommerce/product-collections?type=promo',
                        permission: 'product-collections.view',
                    },
                ],
            },
            {
                title: 'Banner Slides',
                href: '/dashboard/ecommerce/banner-slides',
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
                href: '/dashboard/ecommerce/products',
                icon: Package,
                permission: 'products.view',
            },
            {
                title: 'Stok Unit',
                href: '/dashboard/ecommerce/product-stock-units',
                icon: ScanBarcode,
                permission: 'product-stock-units.view',
            },

            {
                title: 'Orders',
                href: '/dashboard/orders',
                icon: ClipboardList,
                permission: 'orders.view',
            },
            {
                title: 'Customers',
                href: '/dashboard/ecommerce/customers',
                icon: Users,
                permission: 'customers.view',
            },
            {
                title: 'Carts',
                href: '/dashboard/ecommerce/carts',
                icon: ShoppingCart,
                permission: 'carts.view',
            },
            {
                title: 'Payments',
                href: '/dashboard/ecommerce/payments',
                icon: ShoppingBag,
                permission: 'payments.view',
            },
            {
                title: 'Stock Movements',
                href: '/dashboard/ecommerce/stock-movements',
                icon: Warehouse,
                permission: 'stock-movements.view',
            },
            {
                title: 'Shipping',
                href: '/dashboard/ecommerce/shipping',
                icon: Truck,
                permission: 'shippings.view',
            },
            {
                title: 'Suppliers',
                href: '/dashboard/ecommerce/suppliers',
                icon: Users,
                permission: 'suppliers.view',
            },
            {
                title: 'Barang Masuk',
                href: '/dashboard/ecommerce/incoming-goods',
                icon: ArrowDownLeft,
                permission: 'incoming-goods.view',
            },
            {
                title: 'Retur Barang',
                href: '/dashboard/ecommerce/supplier-returns',
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
                href: '/dashboard/users',
                icon: Users,
                permission: 'users.view',
            },
            {
                title: 'Roles',
                href: '/dashboard/roles',
                icon: ShieldCheck,
                permission: 'roles.view',
            },
            {
                title: 'Permissions',
                href: '/dashboard/permissions',
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
                href: '/dashboard/media',
                icon: Image,
                permission: 'media.view',
            },
            {
                title: 'Menus',
                href: '/dashboard/menus',
                icon: Menu,
                permission: 'menus.view',
            },
            {
                title: 'FAQ',
                href: '/dashboard/ecommerce/faqs',
                icon: CircleHelp,
                permission: 'faqs.view',
            },
            {
                title: 'Site Contents',
                href: '/dashboard/config/site-contents',
                icon: RssIcon,
                permission: 'site-contents.view',
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
                href: '/dashboard/config/main',
                icon: Settings,
                permission: 'settings.view',
            },
        ],
    },
];
