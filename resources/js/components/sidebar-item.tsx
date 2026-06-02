import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';

import { cn } from '@/lib/utils';

export default function SidebarItem({ item, url }: any) {
    const isActive = url.startsWith(item.href);
    const Icon = item.icon;
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const isChildActive = hasChildren
        ? item.children.some((child: any) => url.startsWith(child.href))
        : false;
    const [open, setOpen] = useState(false);
    const isOpen = open || isActive || isChildActive;

    if (hasChildren) {
        return (
            <Collapsible open={isOpen} onOpenChange={setOpen}>
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            isActive={isActive || isChildActive}
                            className={cn(
                                (isActive || isChildActive) &&
                                    'bg-muted font-semibold text-foreground',
                            )}
                        >
                            <div className="flex items-center gap-2">
                                {Icon && <Icon className="size-4" />}
                                <span className="text-xs">{item.title}</span>
                            </div>
                            <ChevronRight
                                className={cn(
                                    'ml-auto size-4 transition-transform',
                                    isOpen && 'rotate-90',
                                )}
                            />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {item.children.map((child: any) => {
                                const isChildCurrent = url.startsWith(child.href);

                                return (
                                    <SidebarMenuSubItem key={child.href}>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isChildCurrent}
                                        >
                                            <Link href={child.href}>
                                                <span>{child.title}</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                );
                            })}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
            </Collapsible>
        );
    }

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
