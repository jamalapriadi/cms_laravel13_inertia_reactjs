import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import { hasPermission } from '@/lib/permissions';

interface Props {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function ManagementLayout({ children, breadcrumbs }: Props) {
    const { url, props } = usePage();

    const menus = [
        {
            label: 'Summary',
            href: '/dashboard/config/management',
            permission: 'settings.view',
        },
        {
            label: 'Users',
            href: '/dashboard/users',
            permission: 'users.view',
        },
        {
            label: 'Roles',
            href: '/dashboard/roles',
            permission: 'roles.view',
        },
        {
            label: 'Permissions',
            href: '/dashboard/permissions',
            permission: 'permissions.view',
        },
    ];

    return (
        <div>
            <div className="flex">
                {/* SECOND SIDEBAR */}
                <aside className="min-h-screen w-60 space-y-2 border-r bg-muted/30 p-4">
                    <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase">
                        Management
                    </h2>

                    {menus
                        .filter((menu) =>
                            hasPermission(props.auth.user, menu.permission),
                        )
                        .map((menu) => {
                            const active = url.startsWith(menu.href);

                            return (
                                <Link
                                    key={menu.href}
                                    href={menu.href}
                                    className={cn(
                                        'block rounded-lg px-3 py-2 text-sm transition',
                                        active
                                            ? 'bg-primary text-white'
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
