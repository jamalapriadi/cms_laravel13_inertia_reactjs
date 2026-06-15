import { Link, usePage } from '@inertiajs/react';
import {
    Tag,
    FolderTree,
    Package,
    ClipboardList,
    Boxes,
    ScanBarcode,
    Users,
    ArrowDownLeft,
    ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

interface Props {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function MasterDataLayout({ children }: Props) {
    const { url, props } = usePage();
    const websiteMode = (props.website_mode as string) || 'commerce';
    const enabledEcommerceMenus = Array.isArray(props.enabled_ecommerce_menus)
        ? (props.enabled_ecommerce_menus as string[])
        : [];

    const menus = [
        {
            key: 'products',
            label: 'Products',
            href: '/my-admin/dashboard/ecommerce/products',
            icon: Package,
        },
        {
            key: 'product-variants',
            label: 'Product Variants',
            href: '/my-admin/dashboard/ecommerce/product-variants',
            icon: Boxes,
        },
        {
            key: 'variant-items',
            label: 'Variant Items',
            href: '/my-admin/dashboard/ecommerce/variant-items',
            icon: ScanBarcode,
        },
        {
            key: 'brands',
            label: 'Brands',
            href: '/my-admin/dashboard/brands',
            icon: Tag,
        },
        {
            key: 'categories',
            label: 'Product Categories',
            href: '/my-admin/dashboard/ecommerce/categories',
            icon: FolderTree,
        },
        {
            key: 'units',
            label: 'Units',
            href: '/my-admin/dashboard/units',
            icon: ClipboardList,
        },
    ];

    const filteredMenus = menus.filter((menu) => {
        if (websiteMode === 'blog') {
            return false;
        }
        if (websiteMode === 'simple_blog_commerce') {
            return enabledEcommerceMenus.includes(menu.key);
        }
        return true;
    });

    return (
        <div>
            <div className="flex min-h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* SECOND SIDEBAR */}
                {filteredMenus.length > 0 && (
                    <aside className="w-64 shrink-0 border-r border-border bg-background px-4 py-6">
                        <h2 className="mb-4 px-3 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                            Store Settings
                        </h2>

                        <nav className="space-y-1">
                            {filteredMenus.map((menu) => {
                                const active = url.startsWith(menu.href);
                                const Icon = menu.icon;

                                return (
                                    <Link
                                        key={menu.href}
                                        href={menu.href}
                                        className={cn(
                                            'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                            active
                                                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                'h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105',
                                                active
                                                    ? 'text-primary-foreground'
                                                    : 'text-muted-foreground group-hover:text-foreground',
                                            )}
                                        />
                                        <span>{menu.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </aside>
                )}

                {/* PAGE CONTENT */}
                <main className="flex-1 bg-muted/30 p-6 dark:bg-muted/20">
                    {children}
                </main>
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
            href: '/my-admin/dashboard',
        },
        {
            title: 'Ecommerce',
            href: '#',
        },
    ],
};
