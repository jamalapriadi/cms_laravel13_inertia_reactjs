import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Clock3,
    LogOut,
    Mail,
    MapPin,
    PackageSearch,
    Phone,
    ReceiptText,
    ShoppingBag,
    ShoppingCart,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { home } from '@/routes';
import { dashboard } from '@/routes/customer';
import { logout } from '@/routes/customer/auth';

type DashboardProps = {
    customer: {
        id: string;
        name: string;
        email: string;
        phone?: string | null;
        address?: string | null;
        last_login_at?: string | null;
        member_since?: string | null;
    };
    orders: {
        id: string;
        invoice_number: string;
        status: string;
        payment_status: string;
        grand_total: number | string;
        created_at?: string | null;
    }[];
    summary: {
        total_orders: number;
        pending_orders: number;
        completed_orders: number;
        active_carts: number;
    };
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

const statusClassNames: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    processing: 'bg-sky-100 text-sky-800',
    shipped: 'bg-violet-100 text-violet-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-rose-100 text-rose-800',
    paid: 'bg-emerald-100 text-emerald-800',
    failed: 'bg-rose-100 text-rose-800',
    expired: 'bg-zinc-200 text-zinc-700',
    refunded: 'bg-slate-200 text-slate-700',
};

const statusLabel = (value: string) =>
    value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());

const formatCurrency = (value: number | string) =>
    currencyFormatter.format(Number(value || 0));

const formatDate = (value?: string | null) =>
    value ? dateFormatter.format(new Date(value)) : '-';

export default function CustomerDashboard({
    customer,
    orders,
    summary,
}: DashboardProps) {
    const shortcuts = [
        {
            title: 'Katalog',
            description: 'Kembali ke halaman utama toko.',
            icon: ShoppingBag,
            href: home().url,
            external: false,
        },
        {
            title: 'Pesanan',
            description: 'Lompat ke riwayat order terbaru.',
            icon: ReceiptText,
            href: '#recent-orders',
            external: true,
        },
        {
            title: 'Profil',
            description: 'Lihat informasi customer Anda.',
            icon: Mail,
            href: '#profile-card',
            external: true,
        },
    ];

    const handleLogout = () => {
        router.post(logout().url);
    };

    return (
        <>
            <Head title="Customer Dashboard" />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,_#0f172a_0%,_#1f2937_48%,_#115e59_100%)] p-6 text-white shadow-[0_28px_60px_-36px_rgba(15,23,42,0.6)] sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl space-y-4">
                            <p className="text-sm font-semibold tracking-[0.28em] text-white/70 uppercase">
                                Customer dashboard
                            </p>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Halo, {customer.name}
                            </h1>
                            <p className="max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                                Semua akses akun customer Anda sekarang
                                terkelola dari area ini, mulai dari ringkasan
                                order, profil, sampai recovery session yang
                                aman.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={home()}
                                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
                            >
                                Belanja sekarang
                                <ArrowRight className="size-4" />
                            </Link>

                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                                onClick={handleLogout}
                            >
                                <LogOut className="size-4" />
                                Logout
                            </Button>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/70">
                        <span className="inline-flex items-center gap-2">
                            <Clock3 className="size-4" />
                            Login terakhir {formatDate(customer.last_login_at)}
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <ShoppingCart className="size-4" />
                            {summary.active_carts} keranjang aktif
                        </span>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Total order</p>
                        <div className="mt-3 flex items-center justify-between">
                            <p className="text-3xl font-semibold text-slate-950">
                                {summary.total_orders}
                            </p>
                            <ReceiptText className="size-8 text-slate-300" />
                        </div>
                    </article>

                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Order pending</p>
                        <div className="mt-3 flex items-center justify-between">
                            <p className="text-3xl font-semibold text-slate-950">
                                {summary.pending_orders}
                            </p>
                            <PackageSearch className="size-8 text-amber-300" />
                        </div>
                    </article>

                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Order selesai</p>
                        <div className="mt-3 flex items-center justify-between">
                            <p className="text-3xl font-semibold text-slate-950">
                                {summary.completed_orders}
                            </p>
                            <ShoppingBag className="size-8 text-emerald-300" />
                        </div>
                    </article>

                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Keranjang aktif
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                            <p className="text-3xl font-semibold text-slate-950">
                                {summary.active_carts}
                            </p>
                            <ShoppingCart className="size-8 text-sky-300" />
                        </div>
                    </article>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div
                        id="recent-orders"
                        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
                    >
                        <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold tracking-[0.2em] text-slate-500 uppercase">
                                    Riwayat pesanan
                                </p>
                                <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                                    Order terbaru Anda
                                </h2>
                            </div>
                            <p className="text-sm text-slate-500">
                                Menampilkan {orders.length} order terbaru.
                            </p>
                        </div>

                        <div className="mt-5 space-y-4">
                            {orders.length > 0 ? (
                                orders.map((order) => (
                                    <article
                                        key={order.id}
                                        className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="space-y-2">
                                                <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                                                    {order.invoice_number}
                                                </p>
                                                <p className="text-lg font-semibold text-slate-950">
                                                    {formatCurrency(
                                                        order.grand_total,
                                                    )}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    Dibuat pada{' '}
                                                    {formatDate(
                                                        order.created_at,
                                                    )}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassNames[order.status] ?? 'bg-slate-200 text-slate-700'}`}
                                                >
                                                    {statusLabel(order.status)}
                                                </span>
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassNames[order.payment_status] ?? 'bg-slate-200 text-slate-700'}`}
                                                >
                                                    Pembayaran{' '}
                                                    {statusLabel(
                                                        order.payment_status,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm leading-7 text-slate-500">
                                    Belum ada order customer yang tercatat.
                                    Setelah checkout pertama berhasil, riwayat
                                    pesanan akan muncul di sini.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-sm font-semibold tracking-[0.2em] text-slate-500 uppercase">
                                Shortcut
                            </p>
                            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                                Aksi cepat customer
                            </h2>

                            <div className="mt-5 grid gap-3">
                                {shortcuts.map((shortcut) => {
                                    const Icon = shortcut.icon;

                                    if (shortcut.external) {
                                        return (
                                            <a
                                                key={shortcut.title}
                                                href={shortcut.href}
                                                className="flex items-start gap-4 rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-slate-300 hover:bg-slate-50"
                                            >
                                                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                                                    <Icon className="size-5" />
                                                </span>
                                                <span className="space-y-1">
                                                    <span className="block font-semibold text-slate-950">
                                                        {shortcut.title}
                                                    </span>
                                                    <span className="block text-sm leading-6 text-slate-500">
                                                        {shortcut.description}
                                                    </span>
                                                </span>
                                            </a>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={shortcut.title}
                                            href={shortcut.href}
                                            className="flex items-start gap-4 rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-slate-300 hover:bg-slate-50"
                                        >
                                            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                                                <Icon className="size-5" />
                                            </span>
                                            <span className="space-y-1">
                                                <span className="block font-semibold text-slate-950">
                                                    {shortcut.title}
                                                </span>
                                                <span className="block text-sm leading-6 text-slate-500">
                                                    {shortcut.description}
                                                </span>
                                            </span>
                                        </Link>
                                    );
                                })}

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex items-start gap-4 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-4 text-left transition hover:bg-rose-50"
                                >
                                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-600 text-white">
                                        <LogOut className="size-5" />
                                    </span>
                                    <span className="space-y-1">
                                        <span className="block font-semibold text-rose-900">
                                            Logout
                                        </span>
                                        <span className="block text-sm leading-6 text-rose-700/80">
                                            Akhiri session customer Anda dengan
                                            aman.
                                        </span>
                                    </span>
                                </button>
                            </div>
                        </section>

                        <section
                            id="profile-card"
                            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            <p className="text-sm font-semibold tracking-[0.2em] text-slate-500 uppercase">
                                Profil customer
                            </p>
                            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                                Informasi akun
                            </h2>

                            <div className="mt-5 grid gap-4">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        <Mail className="size-4" />
                                        Email
                                    </div>
                                    <p className="mt-2 font-semibold text-slate-950">
                                        {customer.email}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        <Phone className="size-4" />
                                        Nomor telepon
                                    </div>
                                    <p className="mt-2 font-semibold text-slate-950">
                                        {customer.phone || 'Belum tersedia'}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        <MapPin className="size-4" />
                                        Alamat
                                    </div>
                                    <p className="mt-2 text-sm leading-7 text-slate-700">
                                        {customer.address ||
                                            'Alamat customer belum disimpan. Anda masih bisa belanja dan melengkapinya nanti saat checkout.'}
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </section>
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
