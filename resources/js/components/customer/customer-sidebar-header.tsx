import { usePage } from '@inertiajs/react';
import { ChevronsUpDown, Search } from 'lucide-react';

import AppLogo from '@/components/app-logo';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { CustomerMenuContent } from '@/components/customer/customer-menu-content';
import { CustomerUserInfo } from '@/components/customer/customer-user-info';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import type { CustomerSession } from './customer-types';

type CustomerPageProps = {
    customerAuth?: {
        customer?: CustomerSession | null;
    };
};

export function CustomerSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const customer = (usePage().props as CustomerPageProps).customerAuth
        ?.customer;

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between border-b px-3 shadow sm:px-4 lg:px-6">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <SidebarTrigger className="-ml-1" />

                    <div className="hidden min-w-0 md:block">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>

                    <div className="min-w-0 md:hidden">
                        <AppLogo />
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden md:block">
                        <form
                            role="search"
                            className="relative w-55 lg:w-[320px] xl:w-95"
                        >
                            <Search
                                size={18}
                                className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                            />

                            <Input
                                type="search"
                                placeholder="Cari pesanan..."
                                aria-label="Cari"
                                className="h-10 rounded-xl border bg-background pl-10 shadow-none transition-all focus-visible:ring-2"
                            />
                        </form>
                    </div>

                    <button
                        type="button"
                        aria-label="Cari"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-muted md:hidden"
                    >
                        <Search size={20} />
                    </button>

                    {customer && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    aria-label="Menu akun customer"
                                    className="flex h-10 items-center gap-2 rounded-xl px-2 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                >
                                    <CustomerUserInfo customer={customer} />
                                    <ChevronsUpDown className="hidden size-4 text-muted-foreground sm:block" />
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                align="end"
                                sideOffset={8}
                                className="w-56 rounded-lg"
                            >
                                <CustomerMenuContent customer={customer} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </header>
    );
}
