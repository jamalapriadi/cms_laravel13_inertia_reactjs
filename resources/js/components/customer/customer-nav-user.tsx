import { usePage } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';

import { CustomerMenuContent } from '@/components/customer/customer-menu-content';
import { CustomerUserInfo } from '@/components/customer/customer-user-info';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import type { CustomerSession } from './customer-types';

type CustomerPageProps = {
    customerAuth?: {
        customer?: CustomerSession | null;
    };
};

export function CustomerNavUser() {
    const customer = (usePage().props as CustomerPageProps).customerAuth
        ?.customer;
    const { state } = useSidebar();
    const isMobile = useIsMobile();

    if (!customer) {
        return null;
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="group text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent"
                            data-test="customer-sidebar-menu-button"
                        >
                            <CustomerUserInfo customer={customer} showEmail />
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="end"
                        side={
                            isMobile
                                ? 'bottom'
                                : state === 'collapsed'
                                  ? 'left'
                                  : 'bottom'
                        }
                    >
                        <CustomerMenuContent customer={customer} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
