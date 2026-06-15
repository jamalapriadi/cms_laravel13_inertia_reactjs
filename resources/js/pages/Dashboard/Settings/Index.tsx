import { Head, useForm } from '@inertiajs/react';
import {
    Headphones,
    Languages,
    FileText,
    Search,
    Settings,
    Users,
    Image,
    Map,
    BookOpen,
    Layout,
    ShoppingCart as CartIcon,
    Package,
    Boxes,
    ScanBarcode,
    Tag,
    FolderTree,
    ClipboardList,
    Users as UsersIcon,
    ShoppingCart,
    BadgeDollarSign,
    Warehouse,
    Truck,
    ArrowDownLeft,
    ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
        href: '/my-admin/dashboard/config/general',
        icon: Settings,
    },
    {
        title: 'Preferences',
        description:
            'The title and meta description help define how your web shows up on search engines.',
        href: '/my-admin/dashboard/config/preferences',
        icon: Search,
    },
    {
        title: 'Users & Permissions',
        description: 'View and manage what Users can see or do in your web.',
        href: '/my-admin/dashboard/config/management',
        icon: Users,
    },
    {
        title: 'Customer',
        description: 'View and manage what Customer can do in your web.',
        href: '/my-admin/dashboard/config/customer',
        icon: Headphones,
    },
    {
        title: 'Media',
        description: 'Manage image sizes and media configuration.',
        href: '/my-admin/dashboard/config/media',
        icon: Image,
    },
    {
        title: 'Language',
        description: 'Configuration for your site language.',
        href: '/my-admin/dashboard/config/language',
        icon: Languages,
    },
    {
        title: 'Site Contents',
        description:
            'Manage dynamic text keys and translations by active locale.',
        href: '/my-admin/dashboard/config/site-contents',
        icon: FileText,
    },
    {
        title: 'Wilayah',
        description: 'Manage wilayah.',
        href: '/my-admin/dashboard/provinces',
        icon: Map,
    },
];

const ECOMMERCE_MENUS = [
    { key: 'products', title: 'Products', description: 'Manage products, prices, and details', icon: Package },
    { key: 'product-variants', title: 'Product Variants', description: 'Configure options like size or color', icon: Boxes },
    { key: 'variant-items', title: 'Variant Items', description: 'Manage variants and inventory', icon: ScanBarcode },
    { key: 'brands', title: 'Brands', description: 'Manage product brands', icon: Tag },
    { key: 'categories', title: 'Categories', description: 'Organize products into categories', icon: FolderTree },
    { key: 'units', title: 'Units', description: 'Product measurement units', icon: ClipboardList },
    { key: 'product-stock-units', title: 'Stok Unit', description: 'Manage item-level stock', icon: ScanBarcode },
    { key: 'orders', title: 'Orders', description: 'View and manage customer orders', icon: ClipboardList },
    { key: 'customers', title: 'Customers', description: 'View registered customers', icon: UsersIcon },
    { key: 'carts', title: 'Carts', description: 'Monitor shopping carts', icon: ShoppingCart },
    { key: 'payments', title: 'Payments', description: 'View transaction logs', icon: BadgeDollarSign },
    { key: 'stock-movements', title: 'Stock Movements', description: 'Track stock transactions', icon: Warehouse },
    { key: 'shipping', title: 'Shipping', description: 'Manage shipping configurations', icon: Truck },
    { key: 'suppliers', title: 'Suppliers', description: 'Supplier registry', icon: UsersIcon },
    { key: 'incoming-goods', title: 'Barang Masuk', description: 'Record incoming stock', icon: ArrowDownLeft },
    { key: 'supplier-returns', title: 'Retur Barang', description: 'Record supplier returns', icon: ArrowUpRight },
];

function ConfigCard({ item }: { item: MenuItem }) {
    const Icon = item.icon;

    return (
        <a
            href={item.href}
            className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xs transition-all hover:border-primary/60 hover:bg-accent/40 hover:shadow-xs dark:border-white/10 dark:bg-zinc-900/70 dark:hover:border-primary/70 dark:hover:bg-zinc-800/80"
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all group-hover:scale-105 group-hover:bg-primary/90">
                <Icon className="h-5 w-5" />
            </div>

            <div className="flex flex-col gap-0.5">
                <h3 className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                    {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {item.description}
                </p>
            </div>
        </a>
    );
}

interface Props {
    websiteMode: string;
    enabledEcommerceMenus: string[];
}

export default function ConfigMain({ websiteMode, enabledEcommerceMenus }: Props) {
    const { data, setData, post, processing } = useForm({
        website_mode: websiteMode,
        enabled_ecommerce_menus: enabledEcommerceMenus,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/my-admin/dashboard/options', {
            preserveScroll: true,
            onStart: () => toast.loading('Saving website mode...', { id: 'website-mode' }),
            onSuccess: () => toast.success('Website mode updated successfully', { id: 'website-mode' }),
            onError: () => toast.error('Failed to update website mode', { id: 'website-mode' }),
        });
    };

    const handleCheckboxChange = (key: string, checked: boolean) => {
        if (checked) {
            setData('enabled_ecommerce_menus', [...data.enabled_ecommerce_menus, key]);
        } else {
            setData(
                'enabled_ecommerce_menus',
                data.enabled_ecommerce_menus.filter((item) => item !== key),
            );
        }
    };

    const MODES = [
        {
            value: 'blog',
            title: 'Blog / Company Profile Only',
            description: 'Focus entirely on content. All e-commerce menus and pages will be hidden and blocked.',
            icon: BookOpen,
        },
        {
            value: 'commerce',
            title: 'E-commerce Full',
            description: 'Enable all features. Displays both company profile/blog and all e-commerce menus.',
            icon: Layout,
        },
        {
            value: 'simple_blog_commerce',
            title: 'Simple Blog + Selected Commerce',
            description: 'Custom setup. Enable blogs and pick only specific e-commerce menus you want to show.',
            icon: CartIcon,
        },
    ];

    return (
        <>
            <Head title="Pengaturan Utama" />

            <div className="container mx-auto px-6 py-6 max-w-7xl">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Pengaturan
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Manage all system configurations and dashboard features in one place
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* LEFT: Website Mode Form (Col Span 2) */}
                        <div className="lg:col-span-2 space-y-6">
                            <form onSubmit={submit}>
                                <Card className="border border-border shadow-sm bg-card rounded-2xl">
                                    <CardHeader className="border-b border-border pb-6 px-6">
                                        <CardTitle className="text-lg font-bold text-foreground">
                                            Website Mode / Jenis Website
                                        </CardTitle>
                                        <CardDescription className="text-sm">
                                            Choose the operation mode for your website. This alters visible menus and endpoint availability.
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="pt-6 px-6 space-y-6">
                                        <div className="grid grid-cols-1 gap-4">
                                            {MODES.map((mode) => {
                                                const selected = data.website_mode === mode.value;
                                                const Icon = mode.icon;

                                                return (
                                                    <button
                                                        key={mode.value}
                                                        type="button"
                                                        onClick={() => setData('website_mode', mode.value)}
                                                        className={`relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                                            selected
                                                                ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xs ring-1 ring-primary'
                                                                : 'border-border bg-card hover:bg-muted/40'
                                                        }`}
                                                    >
                                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                                                            selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/30 text-muted-foreground'
                                                        }`}>
                                                            <Icon className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <span className="block font-semibold text-foreground text-sm">
                                                                {mode.title}
                                                            </span>
                                                            <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">
                                                                {mode.description}
                                                            </span>
                                                        </div>
                                                        {selected && (
                                                            <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Simple Blog Commerce Sub-Menu Picker */}
                                        {data.website_mode === 'simple_blog_commerce' && (
                                            <div className="space-y-4 border-t border-border pt-6 animate-in fade-in duration-200">
                                                <div>
                                                    <h3 className="text-sm font-semibold text-foreground">
                                                        Pilih Menu E-commerce yang Aktif
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        Centang menu yang ingin ditampilkan di dashboard utama dan diizinkan aksesnya.
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                                                    {ECOMMERCE_MENUS.map((menu) => {
                                                        const checked = data.enabled_ecommerce_menus.includes(menu.key);
                                                        const MenuIcon = menu.icon;
                                                        return (
                                                            <div
                                                                key={menu.key}
                                                                onClick={() => handleCheckboxChange(menu.key, !checked)}
                                                                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all duration-200 select-none ${
                                                                    checked
                                                                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                                                        : 'border-border hover:bg-muted/40'
                                                                }`}
                                                            >
                                                                <div className="pt-0.5">
                                                                    <Checkbox
                                                                        id={`menu-${menu.key}`}
                                                                        checked={checked}
                                                                        onCheckedChange={(val) => handleCheckboxChange(menu.key, !!val)}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                </div>
                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted/40 text-muted-foreground">
                                                                    <MenuIcon className="h-4 w-4" />
                                                                </div>
                                                                <div className="flex flex-col gap-0.5">
                                                                    <Label
                                                                        htmlFor={`menu-${menu.key}`}
                                                                        className="font-semibold text-xs text-foreground cursor-pointer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        {menu.title}
                                                                    </Label>
                                                                    <span className="text-[10px] text-muted-foreground leading-tight">
                                                                        {menu.description}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>

                                    <CardFooter className="border-t border-border pt-4 px-6 flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="px-6"
                                        >
                                            {processing ? 'Saving...' : 'Save Configuration'}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </form>
                        </div>

                        {/* RIGHT: Quick Access Settings Modules (Col Span 1) */}
                        <div className="space-y-4">
                            <Card className="border border-border shadow-sm bg-card rounded-2xl">
                                <CardHeader className="pb-4 px-6">
                                    <CardTitle className="text-md font-bold text-foreground">
                                        Modul Pengaturan Lainnya
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Quick links to customize preferences, languages, media, and other system resources.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="px-6 pb-6">
                                    <div className="flex flex-col gap-3">
                                        {MENUS.map((item) => (
                                            <ConfigCard key={item.href} item={item} />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
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
            href: '/my-admin/dashboard/config/main',
        },
    ],
};
