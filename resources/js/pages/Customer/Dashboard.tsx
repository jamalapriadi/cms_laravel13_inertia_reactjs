import { Head } from '@inertiajs/react';
import { Mail, Phone, ShoppingBag, ShoppingCart } from 'lucide-react';

import FaqSection from '@/components/customer/FaqSection';
import HomeBannerSlider from '@/components/customer/HomeBannerSlider';
import { dashboard } from '@/routes/customer';

type Props = {
    customer: {
        name: string;
        email: string;
        phone?: string | null;
        last_login_at?: string | null;
    };
    summary: {
        orders: number;
        carts: number;
    };
    bannerSlides: {
        id: string;
        title: string | null;
        subtitle: string | null;
        description: string | null;
        image_url: string | null;
        mobile_image_url: string | null;
        button_text: string | null;
        button_url: string | null;
    }[];
    collections: {
        id: string;
        name: string;
        slug: string;
        type: string | null;
        title: string | null;
        description: string | null;
        banner_image_url: string | null;
        items: {
            id: string;
            product_name: string | null;
            variant_name: string | null;
            sku: string | null;
            price: number;
            image: string | null;
            stock: number | null;
        }[];
    }[];
    faqs: {
        id: string;
        question: string;
        answer: string;
        type: string;
        position: string | null;
    }[];
    contents: Record<string, string | null>;
    locale: string;
};

export default function CustomerDashboard({
    customer,
    summary,
    bannerSlides,
    collections,
    faqs,
    contents,
}: Props) {
    const heroEyebrow =
        contents['homepage.hero.eyebrow'] ?? 'Smart Ecommerce Deals';
    const heroTitle =
        contents['homepage.hero.title'] ??
        'Good for Your Wallet, Smart Choice in Japan';
    const heroSubtitle =
        contents['homepage.hero.subtitle'] ??
        'Better Prices. Authentic Devices. Guaranteed Performance.';
    const heroPrimaryButton =
        contents['homepage.hero.button_primary'] ?? 'Shop Now';
    const heroSecondaryButton =
        contents['homepage.hero.button_secondary'] ?? 'View Deals';

    const collectionContentByType: Record<
        string,
        { titleKey: string; descriptionKey: string }
    > = {
        best_seller: {
            titleKey: 'homepage.best_seller.title',
            descriptionKey: 'homepage.best_seller.description',
        },
        exclusive_deals: {
            titleKey: 'homepage.exclusive_deals.title',
            descriptionKey: 'homepage.exclusive_deals.description',
        },
        big_sale: {
            titleKey: 'homepage.big_sale.title',
            descriptionKey: 'homepage.big_sale.description',
        },
    };

    const getCollectionContent = (
        type: string | null,
        kind: 'title' | 'description',
    ): string | null => {
        if (!type) {
            return null;
        }

        const config = collectionContentByType[type];

        if (!config) {
            return null;
        }

        const key = kind === 'title' ? config.titleKey : config.descriptionKey;

        return contents[key] ?? null;
    };

    return (
        <>
            <Head title="Customer Dashboard" />

            <div className="flex flex-col gap-6">
                <HomeBannerSlider slides={bannerSlides} />

                <section className="rounded-xl border border-zinc-200 bg-card p-6 dark:border-zinc-800">
                    <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                        {heroEyebrow}
                    </p>
                    <h2 className="mt-2 max-w-2xl text-2xl font-bold leading-tight sm:text-3xl">
                        {heroTitle}
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
                        {heroSubtitle}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <a
                            href="/customer/dashboard"
                            className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                            {heroPrimaryButton}
                        </a>
                        <a
                            href="#promo-collections"
                            className="inline-flex rounded-md border border-input px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                        >
                            {heroSecondaryButton}
                        </a>
                    </div>
                </section>

                <header className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
                    <p className="text-sm text-muted-foreground">
                        Customer Dashboard
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
                        Halo, {customer.name}
                    </h1>
                </header>

                <section className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-zinc-200 bg-card p-5 dark:border-zinc-800">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Mail className="size-4" />
                            Email
                        </div>
                        <p className="mt-3 font-medium">{customer.email}</p>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-card p-5 dark:border-zinc-800">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Phone className="size-4" />
                            Telepon
                        </div>
                        <p className="mt-3 font-medium">
                            {customer.phone || '-'}
                        </p>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-zinc-200 bg-card p-5 dark:border-zinc-800">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total pesanan
                                </p>
                                <p className="mt-2 text-3xl font-semibold">
                                    {summary.orders}
                                </p>
                            </div>
                            <ShoppingBag className="size-8 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-card p-5 dark:border-zinc-800">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Keranjang
                                </p>
                                <p className="mt-2 text-3xl font-semibold">
                                    {summary.carts}
                                </p>
                            </div>
                            <ShoppingCart className="size-8 text-muted-foreground" />
                        </div>
                    </div>
                </section>

                <section id="promo-collections" className="space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold">
                            {contents['homepage.best_seller.title'] || 'Best Seller'}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {contents['homepage.best_seller.description'] ||
                                'Section yang aktif dan ditampilkan di homepage.'}
                        </p>
                    </div>

                    <div className="grid gap-4">
                        {collections.map((collection) => (
                            <div
                                key={collection.id}
                                className="rounded-lg border border-zinc-200 bg-card p-5 dark:border-zinc-800"
                            >
                                <h3 className="font-semibold">
                                    {collection.title ||
                                        getCollectionContent(collection.type, 'title') ||
                                        collection.name}
                                </h3>
                                {(collection.description ||
                                    getCollectionContent(collection.type, 'description')) && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {collection.description ||
                                            getCollectionContent(collection.type, 'description')}
                                    </p>
                                )}
                                <div className="mt-3 grid gap-3 md:grid-cols-3">
                                    {collection.items.slice(0, 6).map((item) => (
                                        <div
                                            key={item.id}
                                            className="rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                                        >
                                            <p className="font-medium">
                                                {item.product_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.variant_name || item.sku || '-'}
                                            </p>
                                            <p className="mt-2 text-xs font-semibold">
                                                Rp {Number(item.price || 0).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {collections.length === 0 && (
                            <div className="rounded-lg border border-dashed border-zinc-300 p-5 text-sm text-muted-foreground dark:border-zinc-700">
                                Belum ada collection aktif yang ditandai show
                                home.
                            </div>
                        )}
                    </div>
                </section>

                <FaqSection
                    faqs={faqs}
                    title={contents['homepage.faq.title'] || 'Frequently Asked Questions'}
                    description={
                        contents['homepage.faq.description'] ||
                        'Find answers to common questions before shopping.'
                    }
                />
            </div>
        </>
    );
}

CustomerDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Customer Dashboard',
            href: dashboard(),
        },
    ],
};
