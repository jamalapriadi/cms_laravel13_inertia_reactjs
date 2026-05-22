import { Link } from '@inertiajs/react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

import { cn } from '@/lib/utils';

export default function SidebarItem({ item, url }: any) {
    const isActive = url.startsWith(item.href);
    const Icon = item.icon;

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={isActive}
                className={cn(
                    isActive && 'bg-muted font-semibold text-foreground',
                )}
            >
                <Link href={item.href} className="flex items-center gap-2">
                    {Icon && <Icon className="size-4" />}
                    <span className="text-xs">{item.title}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}
