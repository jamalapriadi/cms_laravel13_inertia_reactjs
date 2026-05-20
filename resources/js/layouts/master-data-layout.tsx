import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import { 
    Tag, 
    FolderTree, 
    Package, 
    ClipboardList, 
    ShoppingCart, 
    CreditCard, 
    TrendingUp, 
    Truck 
} from 'lucide-react';

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
            icon: Tag,
        },
        {
            label: 'Product Categories',
            href: '/dashboard/ecommerce/categories',
            icon: FolderTree,
        },
        {
            label: 'Products',
            href: '/dashboard/ecommerce/products',
            icon: Package,
        },
        {
            label: 'Orders',
            href: '/dashboard/orders',
            icon: ClipboardList,
        },
        {
            label: 'Carts',
            href: '/dashboard/ecommerce/carts',
            icon: ShoppingCart,
        },
        {
            label: 'Payments',
            href: '/dashboard/ecommerce/payments',
            icon: CreditCard,
        },
        {
            label: 'Stock Movements',
            href: '/dashboard/ecommerce/stock-movements',
            icon: TrendingUp,
        },
        {
            label: 'Shipping',
            href: '/dashboard/ecommerce/shipping',
            icon: Truck,
        },
    ];

    return (
        <div>
            <div className="flex rounded-2xl border border-border bg-card shadow-sm overflow-hidden min-h-[calc(100vh-8rem)]">
                {/* SECOND SIDEBAR */}
                <aside className="w-64 border-r border-border bg-background px-4 py-6 shrink-0">
                    <h2 className="mb-4 px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Store Settings
                    </h2>

                    <nav className="space-y-1">
                        {menus.map((menu) => {
                            const active = url.startsWith(menu.href);
                            const Icon = menu.icon;

                            return (
                                <Link
                                    key={menu.href}
                                    href={menu.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
                                        active
                                            ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    <Icon className={cn(
                                        "w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105", 
                                        active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                                    )} />
                                    <span>{menu.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* PAGE CONTENT */}
                <main className="flex-1 p-6 bg-slate-50/30 dark:bg-slate-900/10">
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
            href: '/dashboard',
        },
        {
            title: 'Ecommerce',
            href: '#',
        },
    ],
};
