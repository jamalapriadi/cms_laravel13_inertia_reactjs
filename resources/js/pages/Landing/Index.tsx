import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BadgeDollarSign,
    Boxes,
    Headset,
    ShieldCheck,
    Sparkles,
    Store,
    Truck,
} from 'lucide-react';

import AppLogo from '@/components/app-logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home, login } from '@/routes';

type CategoryItem = {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    parent_id: string | null;
    show_home: boolean;
    is_publish: boolean;
    products_count?: number;
};

type ProductItem = {
    id: string;
    name: string;
    slug: string;
    sku: string | null;
    short_description: string | null;
    thumbnail: string | null;
    price: number;
    min_price: number;
    max_price: number;
    selling_price: number;
    final_price: number;
    stock: number;
    has_stock: boolean;
    stock_status: string;
    sold_count: number;
    has_variant: boolean;
    condition: string | null;
    brand?: {
        name: string;
        slug: string;
    } | null;
    categories?: Array<{
        id: string;
        name: string;
        slug: string;
    }>;
};

type BannerSlideItem = {
    id: string;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    image_url: string | null;
    mobile_image_url: string | null;
    button_text: string | null;
    button_url: string | null;
};

type Props = {
    bannerSlides: BannerSlideItem[];
    categories: CategoryItem[];
    featuredProducts: ProductItem[];
    latestProducts: ProductItem[];
    contents: Record<string, string | null>;
};

const fallbackCategories: CategoryItem[] = [
    {
        id: 'fallback-cctv',
        name: 'CCTV & Security',
        slug: 'cctv-security',
        image: null,
        parent_id: null,
        show_home: true,
        is_publish: true,
        products_count: 12,
    },
    {
        id: 'fallback-networking',
        name: 'Networking',
        slug: 'networking',
        image: null,
        parent_id: null,
        show_home: true,
        is_publish: true,
        products_count: 18,
    },
    {
        id: 'fallback-accessories',
        name: 'Aksesoris Toko',
        slug: 'aksesoris-toko',
        image: null,
        parent_id: null,
        show_home: false,
        is_publish: true,
        products_count: 9,
    },
    {
        id: 'fallback-office',
        name: 'Office Electronics',
        slug: 'office-electronics',
        image: null,
        parent_id: null,
        show_home: false,
        is_publish: true,
        products_count: 14,
    },
];

const fallbackProducts: ProductItem[] = [
    {
        id: 'fallback-1',
        name: 'Paket Kamera Outdoor Full HD',
        slug: 'paket-kamera-outdoor-full-hd',
        sku: 'GTS-CCTV-01',
        short_description:
            'Solusi pengawasan untuk rumah dan toko dengan kualitas gambar jernih.',
        thumbnail: null,
        price: 1250000,
        min_price: 1250000,
        max_price: 1250000,
        selling_price: 1250000,
        final_price: 1250000,
        stock: 12,
        has_stock: true,
        stock_status: 'in_stock',
        sold_count: 42,
        has_variant: false,
        condition: 'new',
        brand: {
            name: 'Gitatrading Choice',
            slug: 'gitatrading-choice',
        },
        categories: [
            {
                id: 'fallback-cctv',
                name: 'CCTV & Security',
                slug: 'cctv-security',
            },
        ],
    },
    {
        id: 'fallback-2',
        name: 'Router Dual Band Bisnis',
        slug: 'router-dual-band-bisnis',
        sku: 'GTS-NET-02',
        short_description:
            'Koneksi stabil untuk kantor kecil dan usaha yang butuh performa konsisten.',
        thumbnail: null,
        price: 890000,
        min_price: 890000,
        max_price: 890000,
        selling_price: 890000,
        final_price: 890000,
        stock: 20,
        has_stock: true,
        stock_status: 'in_stock',
        sold_count: 27,
        has_variant: false,
        condition: 'new',
        brand: {
            name: 'Gitatrading Choice',
            slug: 'gitatrading-choice',
        },
        categories: [
            {
                id: 'fallback-networking',
                name: 'Networking',
                slug: 'networking',
            },
        ],
    },
    {
        id: 'fallback-3',
        name: 'Barcode Scanner Retail',
        slug: 'barcode-scanner-retail',
        sku: 'GTS-RTL-03',
        short_description:
            'Mempercepat proses kasir dan pencatatan stok dengan pembacaan responsif.',
        thumbnail: null,
        price: 675000,
        min_price: 675000,
        max_price: 675000,
        selling_price: 675000,
        final_price: 675000,
        stock: 8,
        has_stock: true,
        stock_status: 'in_stock',
        sold_count: 15,
        has_variant: false,
        condition: 'new',
        brand: {
            name: 'Gitatrading Choice',
            slug: 'gitatrading-choice',
        },
        categories: [
            {
                id: 'fallback-accessories',
                name: 'Aksesoris Toko',
                slug: 'aksesoris-toko',
            },
        ],
    },
    {
        id: 'fallback-4',
        name: 'Printer Label Pengiriman',
        slug: 'printer-label-pengiriman',
        sku: 'GTS-OFC-04',
        short_description:
            'Cocok untuk operasional toko online dengan kebutuhan label cepat dan rapi.',
        thumbnail: null,
        price: 1450000,
        min_price: 1450000,
        max_price: 1450000,
        selling_price: 1450000,
        final_price: 1450000,
        stock: 6,
        has_stock: true,
        stock_status: 'in_stock',
        sold_count: 21,
        has_variant: false,
        condition: 'new',
        brand: {
            name: 'Gitatrading Choice',
            slug: 'gitatrading-choice',
        },
        categories: [
            {
                id: 'fallback-office',
                name: 'Office Electronics',
                slug: 'office-electronics',
            },
        ],
    },
];

const strengths = [
    {
        title: 'Produk original',
        description:
            'Kami prioritaskan barang yang siap jual, rapi, dan jelas spesifikasinya.',
        icon: ShieldCheck,
    },
    {
        title: 'Harga kompetitif',
        description:
            'Kurasi produk fokus ke value terbaik untuk kebutuhan rumah, kantor, dan toko.',
        icon: BadgeDollarSign,
    },
    {
        title: 'Pengiriman cepat',
        description:
            'Alur stok dan pemrosesan pesanan dibuat efisien agar pesanan cepat jalan.',
        icon: Truck,
    },
    {
        title: 'Support konsultasi',
        description:
            'Tim siap bantu pilih produk yang pas sebelum kamu checkout atau restock.',
        icon: Headset,
    },
];

const quickLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Kategori', href: '#categories' },
    { label: 'Produk', href: '#products' },
    { label: 'Tentang Kami', href: '#about' },
    { label: 'Kontak', href: '#contact' },
];

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

function productPriceLabel(product: ProductItem): string {
    if (
        product.min_price > 0 &&
        product.max_price > 0 &&
        product.min_price !== product.max_price
    ) {
        return `${formatCurrency(product.min_price)} - ${formatCurrency(product.max_price)}`;
    }

    return formatCurrency(
        product.final_price || product.selling_price || product.price,
    );
}

export default function LandingIndex({
    bannerSlides,
    categories,
    featuredProducts,
    latestProducts,
    contents,
}: Props) {
    const heroEyebrow =
        contents['homepage.hero.eyebrow'] ?? 'Gitatrading Store';
    const heroTitle =
        contents['homepage.hero.title'] ??
        'Perlengkapan toko dan elektronik pilihan untuk bisnis yang ingin bergerak lebih cepat.';
    const heroSubtitle =
        contents['homepage.hero.subtitle'] ??
        'Temukan kategori populer, produk unggulan, dan stok pilihan yang siap mendukung operasional harian toko, kantor, maupun rumah.';
    const heroPrimaryButton =
        contents['homepage.hero.button_primary'] ?? 'Lihat Produk';
    const heroSecondaryButton =
        contents['homepage.hero.button_secondary'] ?? 'Hubungi Kami';
    const productSectionTitle =
        contents['homepage.best_seller.title'] ?? 'Produk unggulan';
    const productSectionDescription =
        contents['homepage.best_seller.description'] ??
        'Pilihan produk yang paling sering dicari pelanggan Gitatrading Store.';
    const footerDescription =
        contents['footer.description'] ??
        'Gitatrading Store membantu bisnis bergerak dengan produk berkualitas, harga masuk akal, dan layanan yang responsif.';

    const displayedCategories =
        categories.length > 0 ? categories : fallbackCategories;
    const prioritizedProducts =
        featuredProducts.length > 0 ? featuredProducts : latestProducts;
    const displayedProducts =
        prioritizedProducts.length > 0 ? prioritizedProducts : fallbackProducts;
    const latestShowcase =
        latestProducts.length > 0 ? latestProducts : fallbackProducts;
    const heroSlide = bannerSlides[0] ?? null;
    const secondarySlides = bannerSlides.slice(1, 3);

    return (
        <>
            <Head title="Gitatrading Store - Toko Online Produk Berkualitas">
                <meta
                    head-key="description"
                    name="description"
                    content="Landing page publik Gitatrading Store untuk menampilkan kategori, produk unggulan, keunggulan layanan, dan akses cepat ke admin login."
                />
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700,800"
                    rel="stylesheet"
                />
            </Head>

            <main
                id="home"
                className="relative overflow-hidden"
                style={{ fontFamily: "'Plus Jakarta Sans', var(--font-sans)" }}
            >
                <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,_rgba(13,107,95,0.18),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(191,90,36,0.18),_transparent_36%),linear-gradient(180deg,_#fbf7ef_0%,_#f7f2e8_100%)]" />
                <div className="absolute top-24 right-[-5rem] -z-10 h-64 w-64 rounded-full bg-[#0d6b5f]/10 blur-3xl" />
                <div className="absolute top-56 left-[-5rem] -z-10 h-72 w-72 rounded-full bg-[#bf5a24]/12 blur-3xl" />

                <header className="sticky top-0 z-30 border-b border-[#d7c9b4]/70 bg-[#f7f2e8]/85 backdrop-blur">
                    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between gap-4">
                            <Link href={home()} className="shrink-0">
                                <AppLogo />
                            </Link>

                            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
                                {quickLinks.map((item) => (
                                    <a
                                        key={item.href}
                                        href={item.href}
                                        className="transition hover:text-[#0d6b5f]"
                                    >
                                        {item.label}
                                    </a>
                                ))}
                            </nav>

                            <Button
                                asChild
                                className="bg-[#0d6b5f] text-white hover:bg-[#0a5b51]"
                            >
                                <Link href={login()}>Admin Login</Link>
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-2 md:hidden">
                            {quickLinks.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className="rounded-full border border-[#d7c9b4] bg-white/80 px-3 py-1.5 text-sm text-slate-700 transition hover:border-[#0d6b5f] hover:text-[#0d6b5f]"
                                >
                                    {item.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </header>

                <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
                    <div className="flex flex-col justify-center">
                        <Badge className="w-fit rounded-full bg-[#0d6b5f]/10 px-3 py-1 text-[#0d6b5f]">
                            {heroEyebrow}
                        </Badge>
                        <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                            {heroTitle}
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                            {heroSubtitle}
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button
                                asChild
                                size="lg"
                                className="bg-[#0d6b5f] text-white hover:bg-[#0a5b51]"
                            >
                                <a href="#products">
                                    {heroPrimaryButton}
                                    <ArrowRight className="size-4" />
                                </a>
                            </Button>
                            <Button asChild size="lg" variant="outline">
                                <a href="#contact">{heroSecondaryButton}</a>
                            </Button>
                        </div>

                        <div className="mt-10 grid gap-3 sm:grid-cols-3">
                            <Card className="border-[#d7c9b4] bg-white/75 py-0 shadow-none">
                                <CardContent className="px-5 py-5">
                                    <p className="text-sm text-slate-500">
                                        Kategori pilihan
                                    </p>
                                    <p className="mt-2 text-2xl font-bold text-slate-900">
                                        {displayedCategories.length}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="border-[#d7c9b4] bg-white/75 py-0 shadow-none">
                                <CardContent className="px-5 py-5">
                                    <p className="text-sm text-slate-500">
                                        Produk ditampilkan
                                    </p>
                                    <p className="mt-2 text-2xl font-bold text-slate-900">
                                        {displayedProducts.length}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="border-[#d7c9b4] bg-white/75 py-0 shadow-none">
                                <CardContent className="px-5 py-5">
                                    <p className="text-sm text-slate-500">
                                        Slide promo aktif
                                    </p>
                                    <p className="mt-2 text-2xl font-bold text-slate-900">
                                        {bannerSlides.length}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-5 rounded-[2rem] border border-white/50 bg-white/35 blur-2xl" />
                        <div className="relative space-y-4">
                            <div className="overflow-hidden rounded-[2rem] border border-[#d7c9b4] bg-slate-900 text-white shadow-[0_32px_80px_rgba(15,23,42,0.18)]">
                                {heroSlide?.image_url ? (
                                    <img
                                        src={heroSlide.image_url}
                                        alt={
                                            heroSlide.title ??
                                            'Gitatrading banner'
                                        }
                                        className="h-72 w-full object-cover sm:h-80"
                                    />
                                ) : (
                                    <div className="flex h-72 w-full items-end bg-[linear-gradient(135deg,_#0f172a_0%,_#0d6b5f_55%,_#bf5a24_100%)] p-8 sm:h-80">
                                        <div>
                                            <Badge className="rounded-full bg-white/15 text-white">
                                                Visual Promo
                                            </Badge>
                                            <p className="mt-4 max-w-xs text-2xl leading-tight font-bold">
                                                Showcase produk pilihan untuk
                                                kebutuhan operasional yang lebih
                                                rapi.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid gap-4 p-6 sm:grid-cols-[1fr_auto] sm:items-end">
                                    <div>
                                        <p className="text-sm font-semibold tracking-[0.2em] text-white/70 uppercase">
                                            {heroSlide?.subtitle ??
                                                'Gitatrading Store'}
                                        </p>
                                        <p className="mt-2 text-2xl font-bold">
                                            {heroSlide?.title ??
                                                'Landing page publik untuk etalase produk dan promo utama.'}
                                        </p>
                                        <p className="mt-3 text-sm leading-6 text-white/75">
                                            {heroSlide?.description ??
                                                'Semua visitor bisa melihat gambaran kategori dan produk pilihan tanpa harus masuk ke area admin.'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-white/10 p-4 text-sm text-white/80">
                                        <p className="font-semibold text-white">
                                            {heroSlide?.button_text ??
                                                'Akses cepat'}
                                        </p>
                                        <p className="mt-1">
                                            {heroSlide?.button_url ??
                                                '/my-admin/login'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {(secondarySlides.length > 0
                                    ? secondarySlides
                                    : [
                                          {
                                              id: 'fallback-slide-a',
                                              title: 'Kategori terkurasi',
                                              subtitle: 'Pilih lebih cepat',
                                              description:
                                                  'Susunan kategori dibuat agar pengunjung mudah menemukan kebutuhan toko.',
                                              image_url: null,
                                              mobile_image_url: null,
                                              button_text: null,
                                              button_url: null,
                                          },
                                          {
                                              id: 'fallback-slide-b',
                                              title: 'Produk siap tampil',
                                              subtitle: 'Fallback aman',
                                              description:
                                                  'Saat data belum lengkap, halaman tetap punya struktur yang enak dilihat.',
                                              image_url: null,
                                              mobile_image_url: null,
                                              button_text: null,
                                              button_url: null,
                                          },
                                      ]
                                ).map((slide, index) => (
                                    <Card
                                        key={slide.id}
                                        className="border-[#d7c9b4] bg-white/80 py-0 shadow-none"
                                    >
                                        <CardContent className="px-5 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-10 items-center justify-center rounded-2xl bg-[#0d6b5f]/10 text-[#0d6b5f]">
                                                    {index === 0 ? (
                                                        <Sparkles className="size-5" />
                                                    ) : (
                                                        <Boxes className="size-5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-500">
                                                        {slide.subtitle ??
                                                            'Highlight'}
                                                    </p>
                                                    <p className="font-semibold text-slate-900">
                                                        {slide.title}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="mt-4 text-sm leading-6 text-slate-600">
                                                {slide.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="categories"
                    className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10"
                >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <Badge
                                variant="outline"
                                className="rounded-full border-[#d7c9b4] bg-white/80 text-slate-700"
                            >
                                Kategori
                            </Badge>
                            <h2 className="mt-3 text-3xl font-bold text-slate-900">
                                Jelajahi kategori yang paling sering dicari
                            </h2>
                            <p className="mt-2 max-w-2xl text-slate-600">
                                Kategori ditarik dari data toko bila tersedia,
                                dan tetap tampil rapi dengan fallback saat data
                                belum lengkap.
                            </p>
                        </div>
                        <p className="text-sm text-slate-500">
                            {displayedCategories.length} kategori siap
                            ditampilkan
                        </p>
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {displayedCategories.map((category, index) => (
                            <Card
                                key={category.id}
                                className="group overflow-hidden border-[#d7c9b4] bg-white/85 py-0 shadow-none transition hover:-translate-y-1 hover:border-[#0d6b5f]/40"
                            >
                                <div className="h-2 w-full bg-[linear-gradient(90deg,_#0d6b5f_0%,_#bf5a24_100%)]" />
                                <CardHeader className="px-5 pt-5 pb-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex size-11 items-center justify-center rounded-2xl bg-[#0d6b5f]/10 text-[#0d6b5f]">
                                            <Store className="size-5" />
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="rounded-full border-[#d7c9b4] text-slate-500"
                                        >
                                            {String(index + 1).padStart(2, '0')}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-xl text-slate-900">
                                        {category.name}
                                    </CardTitle>
                                    <CardDescription className="text-slate-600">
                                        {category.products_count
                                            ? `${category.products_count} produk terhubung`
                                            : 'Kategori siap dikembangkan untuk etalase publik'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="px-5 pb-5">
                                    <div className="flex items-center justify-between text-sm text-slate-500">
                                        <span>Slug</span>
                                        <span className="font-medium text-slate-700">
                                            {category.slug}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                <section
                    id="products"
                    className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
                >
                    <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
                        <div className="rounded-[2rem] border border-[#d7c9b4] bg-[#17312b] p-8 text-white">
                            <Badge className="rounded-full bg-white/10 text-white">
                                Produk Pilihan
                            </Badge>
                            <h2 className="mt-4 text-3xl font-bold">
                                {productSectionTitle}
                            </h2>
                            <p className="mt-3 text-sm leading-7 text-white/75">
                                {productSectionDescription}
                            </p>

                            <div className="mt-8 space-y-4">
                                {latestShowcase.slice(0, 3).map((product) => (
                                    <div
                                        key={`latest-${product.id}`}
                                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                                    >
                                        <p className="text-sm text-white/60">
                                            {product.brand?.name ??
                                                product.categories?.[0]?.name ??
                                                'Gitatrading Store'}
                                        </p>
                                        <p className="mt-1 font-semibold text-white">
                                            {product.name}
                                        </p>
                                        <p className="mt-2 text-sm text-white/70">
                                            {product.short_description ??
                                                'Produk terbaru yang siap masuk ke etalase landing page.'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {displayedProducts.map((product) => (
                                <Card
                                    key={product.id}
                                    className="overflow-hidden border-[#d7c9b4] bg-white/90 py-0 shadow-none"
                                >
                                    {product.thumbnail ? (
                                        <img
                                            src={product.thumbnail}
                                            alt={product.name}
                                            className="h-48 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-48 items-end bg-[linear-gradient(135deg,_#efe5d1_0%,_#d5eadf_100%)] p-5">
                                            <div className="rounded-2xl bg-white/80 px-4 py-3">
                                                <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                                                    {product.categories?.[0]
                                                        ?.name ?? 'Produk'}
                                                </p>
                                                <p className="mt-1 font-semibold text-slate-900">
                                                    {product.sku ??
                                                        'Ready Stock'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <CardHeader className="px-5 pt-5 pb-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <Badge className="rounded-full bg-[#0d6b5f]/10 text-[#0d6b5f]">
                                                {product.has_stock
                                                    ? 'Siap dikirim'
                                                    : 'Pre-order'}
                                            </Badge>
                                            <span className="text-sm text-slate-500">
                                                {product.sold_count > 0
                                                    ? `${product.sold_count} terjual`
                                                    : 'Produk baru'}
                                            </span>
                                        </div>
                                        <CardTitle className="line-clamp-2 text-xl text-slate-900">
                                            {product.name}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-3 min-h-[4.5rem] text-slate-600">
                                            {product.short_description ??
                                                'Produk ini siap tampil sebagai bagian dari etalase publik Gitatrading Store.'}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="space-y-4 px-5 pb-5">
                                        <div className="flex items-end justify-between gap-4">
                                            <div>
                                                <p className="text-sm text-slate-500">
                                                    Harga mulai
                                                </p>
                                                <p className="text-2xl font-bold text-slate-900">
                                                    {productPriceLabel(product)}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className="rounded-full border-[#d7c9b4] text-slate-600"
                                            >
                                                {product.categories?.[0]
                                                    ?.name ?? 'Produk umum'}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between text-sm text-slate-500">
                                            <span>Stok</span>
                                            <span className="font-medium text-slate-700">
                                                {product.stock > 0
                                                    ? `${product.stock} unit`
                                                    : 'Konfirmasi ke admin'}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
                    <div className="rounded-[2rem] border border-[#d7c9b4] bg-white/85 p-8">
                        <div className="max-w-2xl">
                            <Badge
                                variant="outline"
                                className="rounded-full border-[#d7c9b4] bg-[#f7f2e8] text-slate-700"
                            >
                                Keunggulan
                            </Badge>
                            <h2 className="mt-4 text-3xl font-bold text-slate-900">
                                Dibuat untuk tampil profesional tanpa membawa
                                nuansa dashboard admin
                            </h2>
                            <p className="mt-3 text-slate-600">
                                Landing page ini berdiri sendiri sebagai halaman
                                publik, tetapi tetap memanfaatkan struktur data
                                dan design system yang sudah ada di project.
                            </p>
                        </div>

                        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {strengths.map((item) => (
                                <Card
                                    key={item.title}
                                    className="border-[#d7c9b4] bg-[#fcfaf6] py-0 shadow-none"
                                >
                                    <CardContent className="px-5 py-5">
                                        <div className="flex size-11 items-center justify-center rounded-2xl bg-[#0d6b5f]/10 text-[#0d6b5f]">
                                            <item.icon className="size-5" />
                                        </div>
                                        <h3 className="mt-4 text-lg font-semibold text-slate-900">
                                            {item.title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            {item.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                <section
                    id="about"
                    className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
                >
                    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                        <Card className="border-[#d7c9b4] bg-[#fffaf2] py-0 shadow-none">
                            <CardContent className="px-6 py-8">
                                <p className="text-sm font-semibold tracking-[0.2em] text-[#0d6b5f] uppercase">
                                    Tentang Kami
                                </p>
                                <h2 className="mt-3 text-3xl font-bold text-slate-900">
                                    Gitatrading Store sebagai etalase publik
                                    yang ringan dan siap berkembang
                                </h2>
                                <p className="mt-4 text-slate-600">
                                    Halaman ini ditujukan untuk visitor umum:
                                    mereka bisa langsung melihat positioning
                                    toko, kategori utama, produk unggulan, dan
                                    alasan memilih Gitatrading Store tanpa masuk
                                    ke area admin.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-[#d7c9b4] bg-[#17312b] py-0 text-white shadow-none">
                            <CardContent className="grid gap-6 px-6 py-8 md:grid-cols-2">
                                <div>
                                    <p className="text-sm font-semibold tracking-[0.2em] text-white/70 uppercase">
                                        Cocok untuk
                                    </p>
                                    <ul className="mt-4 space-y-3 text-sm leading-6 text-white/80">
                                        <li className="flex items-start gap-3">
                                            <Sparkles className="mt-0.5 size-4 shrink-0 text-[#f6b26b]" />
                                            Toko retail yang butuh produk
                                            operasional cepat siap pakai.
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <Sparkles className="mt-0.5 size-4 shrink-0 text-[#f6b26b]" />
                                            Kantor kecil yang ingin belanja
                                            perangkat dengan lebih efisien.
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <Sparkles className="mt-0.5 size-4 shrink-0 text-[#f6b26b]" />
                                            Tim admin yang tetap memerlukan
                                            jalur login terpisah dan aman.
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold tracking-[0.2em] text-white/70 uppercase">
                                        Nilai utama
                                    </p>
                                    <ul className="mt-4 space-y-3 text-sm leading-6 text-white/80">
                                        <li className="flex items-start gap-3">
                                            <ArrowRight className="mt-0.5 size-4 shrink-0 text-[#8ce3d6]" />
                                            Route publik dan admin dipisahkan
                                            dengan jelas.
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <ArrowRight className="mt-0.5 size-4 shrink-0 text-[#8ce3d6]" />
                                            Data homepage bisa bersumber dari
                                            database, dengan fallback yang tetap
                                            enak dipandang.
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <ArrowRight className="mt-0.5 size-4 shrink-0 text-[#8ce3d6]" />
                                            Layout publik tidak mewarisi sidebar
                                            dashboard sehingga pengalaman
                                            visitor tetap bersih.
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
                    <div className="rounded-[2rem] bg-[linear-gradient(135deg,_#0d6b5f_0%,_#17312b_60%,_#bf5a24_100%)] px-6 py-10 text-white shadow-[0_30px_90px_rgba(13,107,95,0.22)] sm:px-10">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-sm font-semibold tracking-[0.2em] text-white/75 uppercase">
                                    CTA
                                </p>
                                <h2 className="mt-3 text-3xl font-bold">
                                    Siapkan halaman depan toko yang meyakinkan
                                    sejak kunjungan pertama
                                </h2>
                                <p className="mt-3 text-white/80">
                                    Visitor bisa langsung menuju kategori dan
                                    produk pilihan, sementara tim internal tetap
                                    punya akses cepat ke area `/my-admin`.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-white text-[#17312b] hover:bg-white/90"
                                >
                                    <a href="#products">
                                        Lihat katalog pilihan
                                    </a>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                                >
                                    <Link href={login()}>Masuk admin</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                <footer
                    id="contact"
                    className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
                >
                    <div className="grid gap-8 rounded-[2rem] border border-[#d7c9b4] bg-white/85 p-8 lg:grid-cols-[1.1fr_0.9fr]">
                        <div>
                            <AppLogo />
                            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600">
                                {footerDescription}
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Button
                                    asChild
                                    className="bg-[#0d6b5f] text-white hover:bg-[#0a5b51]"
                                >
                                    <Link href={login()}>Admin Login</Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <a href="#categories">Lihat kategori</a>
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Link cepat
                                </h2>
                                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                                    {quickLinks.map((item) => (
                                        <li key={`footer-${item.href}`}>
                                            <a
                                                href={item.href}
                                                className="transition hover:text-[#0d6b5f]"
                                            >
                                                {item.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Kontak
                                </h2>
                                <ul className="mt-4 space-y-4 text-sm text-slate-600">
                                    <li className="flex items-start gap-3">
                                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0d6b5f]" />
                                        Area admin aman di `/my-admin/login`
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Headset className="mt-0.5 size-4 shrink-0 text-[#0d6b5f]" />
                                        Konsultasi produk dan kebutuhan stok
                                        bisa diarahkan lewat tim internal.
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Truck className="mt-0.5 size-4 shrink-0 text-[#0d6b5f]" />
                                        Landing page ini siap dikembangkan untuk
                                        katalog publik berikutnya.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 border-t border-[#d7c9b4] pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                        <p>
                            © {new Date().getFullYear()} Gitatrading Store. All
                            rights reserved.
                        </p>
                        <p>
                            Halaman publik untuk visitor, admin tetap di jalur
                            terpisah.
                        </p>
                    </div>
                </footer>
            </main>
        </>
    );
}
