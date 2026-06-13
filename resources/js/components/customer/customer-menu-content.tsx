import { router } from '@inertiajs/react';
import { LogOut } from 'lucide-react';

import {
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes/customer/auth';
import { CustomerUserInfo } from './customer-user-info';
import type { CustomerSession } from './customer-types';

type Props = {
    customer: CustomerSession;
};

export function CustomerMenuContent({ customer }: Props) {
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
        router.post(logout().url);
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <CustomerUserInfo customer={customer} showEmail />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleLogout}
                data-test="customer-logout-button"
            >
                <LogOut className="mr-2" />
                Keluar
            </DropdownMenuItem>
        </>
    );
}
