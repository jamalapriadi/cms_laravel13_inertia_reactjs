import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    ShoppingCart,
    Settings,
    FileText,
    ChevronRight,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { NavUser } from './nav-user';

const menus = [
    {
        title: 'Dashboard',
        href: '/my-admin/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Users',
        href: '/my-admin/dashboard/users',
        icon: Users,
    },
    {
        title: 'Orders',
        href: '/my-admin/dashboard/orders',
        icon: ShoppingCart,
    },
    {
        title: 'Reports',
        href: '/my-admin/dashboard/reports',
        icon: FileText,
    },
    {
        title: 'Settings',
        href: '/my-admin/settings/profile',
        icon: Settings,
    },
];

export default function AdminSidebar() {
    const { url } = usePage();

    return (
        <aside className="top-16 left-0 z-40 h-[calc(100vh-4rem)] w-72 border-r bg-background py-2 shadow-[2px_0_8px_rgba(0,0,0,0.04)]">
            <div className="flex h-full flex-col overflow-y-auto">
                {/* MENU */}
                <nav className="flex flex-1 flex-col gap-1 p-3">
                    {menus.map((menu) => {
                        const isActive =
                            url === menu.href ||
                            url.startsWith(menu.href + '/');

                        const Icon = menu.icon;

                        return (
                            <Link
                                key={menu.href}
                                href={menu.href}
                                className={cn(
                                    'group flex h-11 items-center justify-between rounded-xl px-3 text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={18} />

                                    <span>{menu.title}</span>
                                </div>

                                <ChevronRight
                                    size={16}
                                    className={cn(
                                        'transition-all duration-200',
                                        isActive
                                            ? 'opacity-100'
                                            : 'opacity-0 group-hover:opacity-100',
                                    )}
                                />
                            </Link>
                        );
                    })}
                </nav>

                {/* FOOTER */}
                <div className="border-t p-4">
                    <NavUser />
                </div>
            </div>
        </aside>
    );
}
