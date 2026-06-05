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
                permission: 'product.view',
                children: [
                    {
                        title: 'All Posts',
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
                title: 'Promo',
                href: '/dashboard/ecommerce/product-collections',
                icon: BadgeDollarSign,
                permission: 'product.view',
                children: [
                    {
                        title: 'Product Collections',
                        href: '/dashboard/ecommerce/product-collections',
                        permission: 'product.view',
                    },
                    {
                        title: 'Best Seller',
                        href: '/dashboard/ecommerce/product-collections?type=best_seller',
                        permission: 'product.view',
                    },
                    {
                        title: 'Exclusive Deals',
                        href: '/dashboard/ecommerce/product-collections?type=exclusive_deals',
                        permission: 'product.view',
                    },
                    {
                        title: 'Big Sale',
                        href: '/dashboard/ecommerce/product-collections?type=big_sale',
                        permission: 'product.view',
                    },
                    {
                        title: 'Flash Sale',
                        href: '/dashboard/ecommerce/product-collections?type=flash_sale',
                        permission: 'product.view',
                    },
                    {
                        title: 'Promo Lainnya',
                        href: '/dashboard/ecommerce/product-collections?type=promo',
                        permission: 'product.view',
                    },
                ],
            },
            {
                title: 'Banner Slides',
                href: '/dashboard/ecommerce/banner-slides',
                icon: Image,
                permission: 'product.view',
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
                permission: 'product.view',
            },
            {
                title: 'Stok Unit',
                href: '/dashboard/ecommerce/product-stock-units',
                icon: ScanBarcode,
                permission: 'stock-unit.view',
            },

            {
                title: 'Orders',
                href: '/dashboard/orders',
                icon: ClipboardList,
                permission: 'order.view',
            },
            {
                title: 'Customers',
                href: '/dashboard/ecommerce/customers',
                icon: Users,
                permission: 'customer.view',
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
            {
                title: 'Suppliers',
                href: '/dashboard/ecommerce/suppliers',
                icon: Users,
                permission: 'supplier.view',
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
                title: 'FAQ',
                href: '/dashboard/ecommerce/faqs',
                icon: CircleHelp,
                permission: 'product.view',
            },
            {
                title: 'Site Contents',
                href: '/dashboard/config/site-contents',
                icon: RssIcon,
                permission: 'settings.manage',
            },
            {
                title: 'API Documentation',
                href: '/api/documentation',
                icon: FileText,
                permission: 'settings.manage',
                target: '_blank',
                rel: 'noopener noreferrer',
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
