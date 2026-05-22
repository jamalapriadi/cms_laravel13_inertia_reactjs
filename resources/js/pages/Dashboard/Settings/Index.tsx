import { Head, Link } from '@inertiajs/react';
import {
    Headphones,
    Languages,
    Search,
    Settings,
    Users,
    Image,
    Map,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

interface MenuItem {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
}

const MENUS: MenuItem[] = [
    {
        title: 'General',
        description: 'View and update your store information.',
        href: '/dashboard/config/general',
        icon: Settings,
    },
    {
        title: 'Preferences',
        description:
            'The title and meta description help define how your web shows up on search engines.',
        href: '/dashboard/config/preferences',
        icon: Search,
    },
    {
        title: 'Users & Permissions',
        description: 'View and manage what Users can see or do in your web.',
        href: '/dashboard/config/management',
        icon: Users,
    },
    {
        title: 'Customer',
        description: 'View and manage what Customer can do in your web.',
        href: '/dashboard/config/customer',
        icon: Headphones,
    },
    {
        title: 'Media',
        description: 'Manage image sizes and media configuration.',
        href: '/dashboard/config/media',
        icon: Image,
    },
    {
        title: 'Language',
        description: 'Configuration for your site language.',
        href: '/dashboard/config/language',
        icon: Languages,
    },
    {
        title: 'Wilayah',
        description: 'Manage wilayah.',
        href: '/dashboard/provinces',
        icon: Map,
    },
];

function ConfigCard({ item }: { item: MenuItem }) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-all hover:border-primary/60 hover:bg-accent/40 hover:shadow-md dark:border-white/10 dark:bg-zinc-900/70 dark:hover:border-primary/70 dark:hover:bg-zinc-800/80"
        >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all group-hover:scale-105 group-hover:bg-primary/90">
                <Icon className="h-5 w-5" />
            </div>

            <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                    {item.title}
                </h3>

                <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                </p>
            </div>
        </Link>
    );
}

export default function ConfigMain() {
    return (
        <>
            <Head title="Pengaturan" />

            <div className="container mx-auto px-6 py-6">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Pengaturan
                        </h1>
                        <p className="text-muted-foreground">
                            Manage all system configurations in one place
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {MENUS.map((item) => (
                            <ConfigCard key={item.href} item={item} />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

ConfigMain.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan',
            href: '/dashboard/config/main',
        },
    ],
};
