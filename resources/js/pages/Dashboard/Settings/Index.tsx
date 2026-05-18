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

/**
 * ✅ Type
 */
interface MenuItem {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
}

/**
 * ✅ Data (dipisah biar clean)
 */
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

/**
 * ✅ Card Component (Reusable)
 */
function ConfigCard({ item }: { item: MenuItem }) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            className="group flex items-start gap-4 rounded-2xl border p-5 transition-all hover:border-primary hover:shadow-md"
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/90 text-white transition group-hover:bg-primary">
                <Icon className="h-5 w-5" />
            </div>

            <div className="flex flex-col">
                <h3 className="text-base font-semibold group-hover:text-primary">
                    {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {item.description}
                </p>
            </div>
        </Link>
    );
}

/**
 * ✅ Page
 */
export default function ConfigMain() {
    return (
        <>
            <Head title="Pengaturan" />

            <div className="container mx-auto px-6 py-6">
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold">Pengaturan</h1>
                        <p className="text-muted-foreground">
                            Manage all system configurations in one place
                        </p>
                    </div>

                    {/* Grid */}
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

/**
 * ✅ FIX: Layout Breadcrumbs
 */
ConfigMain.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan',
            href: '/dashboard/config/main', // ❗ FIXED (bukan ConfigMain())
        },
    ],
};
