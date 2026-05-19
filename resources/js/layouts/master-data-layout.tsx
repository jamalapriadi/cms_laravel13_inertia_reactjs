import { Link, usePage } from '@inertiajs/react';

import { cn } from '@/lib/utils';

import type { BreadcrumbItem } from '@/types';

interface Props {
    children: React.ReactNode;

    breadcrumbs?: BreadcrumbItem[];
}

export default function MasterDataLayout({ children }: Props) {
    const { url } = usePage();

    const menus = [
        {
            label: 'Brands',
            href: '/dashboard/brands',
        },
        {
            label: 'Product Categories',
            href: '/dashboard/ecommerce/categories',
        },
        {
            label: 'Products',
            href: '/dashboard/ecommerce/products',
        },
        {
            label: 'Product Variants',
            href: '/dashboard/ecommerce/product-variants',
        },
        {
            label: 'Orders',
            href: '/dashboard/ecommerce/orders',
        },
        {
            label: 'Carts',
            href: '/dashboard/ecommerce/carts',
        },
        {
            label: 'Payments',
            href: '/dashboard/ecommerce/payments',
        },
        {
            label: 'Stock Movements',
            href: '/dashboard/ecommerce/stock-movements',
        },
        {
            label: 'Shipping',
            href: '/dashboard/ecommerce/shipping',
        },
    ];

    return (
        <div>
            <div className="flex rounded-2xl border">
                {/* SECOND SIDEBAR */}
                <aside className="min-h-screen w-64 rounded-tl-2xl rounded-bl-2xl border-r bg-white px-6 py-4">
                    <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase">
                        Ecommerce
                    </h2>

                    {menus.map((menu) => {
                        const active = url.startsWith(menu.href);

                        return (
                            <Link
                                key={menu.href}
                                href={menu.href}
                                className={cn(
                                    'block rounded-lg px-3 py-2 text-sm transition',
                                    active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted',
                                )}
                            >
                                {menu.label}
                            </Link>
                        );
                    })}
                </aside>

                {/* PAGE CONTENT */}
                <div className="flex-1 p-6">{children}</div>
            </div>
        </div>
    );
}

/**
 * ✅ CONSISTENT LAYOUT
 */
MasterDataLayout.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },

        {
            title: 'Ecommerce',
            href: '#',
        },
    ],
};
