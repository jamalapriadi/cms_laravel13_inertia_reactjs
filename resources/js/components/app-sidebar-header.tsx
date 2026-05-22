import { Search, User } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import AppLogo from './app-logo';

import { Input } from './ui/input';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        // <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 bg-card px-6 shadow transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
        //     <div className="flex items-center gap-2">
        //         <SidebarTrigger className="-ml-1" />
        //         <Breadcrumbs breadcrumbs={breadcrumbs} />
        //     </div>
        // </header>

        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between border-b px-3 shadow sm:px-4 lg:px-6">
                {/* LEFT */}
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    {/* SIDEBAR BUTTON */}
                    <SidebarTrigger className="-ml-1" />
                    {/* <Breadcrumbs breadcrumbs={breadcrumbs} /> */}
                    {/* LOGO */}
                    <div className="min-w-0">
                        <AppLogo />
                    </div>
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* DESKTOP SEARCH */}
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
                                placeholder="Search anything..."
                                aria-label="Search"
                                className="h-10 rounded-xl border bg-background pl-10 shadow-none transition-all focus-visible:ring-2"
                            />
                        </form>
                    </div>

                    {/* MOBILE SEARCH BUTTON */}
                    <button
                        type="button"
                        aria-label="Search"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-muted md:hidden"
                    >
                        <Search size={20} />
                    </button>

                    {/* ACCOUNT */}
                    <button
                        type="button"
                        aria-label="Account"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        <User size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
}
