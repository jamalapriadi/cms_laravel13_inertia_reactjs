import { usePage } from '@inertiajs/react';
import { ChevronsUpDown, Menu, Search } from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Input } from '@/components/ui/input';
import { useSidebar } from '@/components/ui/sidebar';

import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';

import AppLogo from './app-logo';

export default function AdminHeader() {
    const { toggleSidebar } = useSidebar();
    const { auth } = usePage().props;

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-3 sm:px-4 lg:px-6">
                {/* LEFT */}
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <button
                        type="button"
                        aria-label="Open sidebar"
                        onClick={toggleSidebar}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:hidden"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="min-w-0">
                        <AppLogo />
                    </div>
                </div>

                {/* RIGHT */}
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
                                placeholder="Search anything..."
                                aria-label="Search"
                                className="h-10 rounded-xl border bg-background pl-10 shadow-none transition-all focus-visible:ring-2"
                            />
                        </form>
                    </div>

                    <button
                        type="button"
                        aria-label="Search"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-muted md:hidden"
                    >
                        <Search size={20} />
                    </button>

                    {/* USER DROPDOWN */}
                    {auth.user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex h-10 items-center gap-2 rounded-xl px-2 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                >
                                    <UserInfo user={auth.user} />

                                    <ChevronsUpDown className="hidden size-4 text-muted-foreground sm:block" />
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                align="end"
                                sideOffset={8}
                                className="w-56 rounded-lg"
                            >
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </header>
    );
}
