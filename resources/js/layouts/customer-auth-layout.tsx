import { Link } from '@inertiajs/react';
import { ShieldCheck, ShoppingBag, Truck } from 'lucide-react';

import type { AuthLayoutProps } from '@/types';
import { home } from '@/routes';

const highlights = [
    {
        title: 'Checkout lebih cepat',
        description: 'Simpan profil customer dan lanjutkan belanja tanpa mengulang data dasar.',
        icon: ShoppingBag,
    },
    {
        title: 'Akun tetap aman',
        description: 'Password reset, login customer, dan session customer dipisahkan dari admin.',
        icon: ShieldCheck,
    },
    {
        title: 'Pantau pesanan',
        description: 'Lihat ringkasan order, status pembayaran, dan shortcut akun dalam satu dashboard.',
        icon: Truck,
    },
];

export default function CustomerAuthLayout({
    children,
    title = '',
    description = '',
}: AuthLayoutProps) {
    return (
        <div className="relative min-h-svh overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.16),_transparent_30%),linear-gradient(180deg,_#fffaf2_0%,_#ffffff_46%,_#f3f7f7_100%)] px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="flex flex-col justify-between rounded-[2rem] border border-amber-200/70 bg-white/75 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur sm:p-8 lg:p-10">
                    <div className="space-y-8">
                        <Link
                            href={home()}
                            className="inline-flex items-center gap-3 rounded-full border border-amber-300/80 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-100"
                        >
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
                                GT
                            </span>
                            Gita Trading Customer
                        </Link>

                        <div className="max-w-xl space-y-4">
                            <p className="text-sm font-semibold tracking-[0.28em] text-teal-700 uppercase">
                                Customer account
                            </p>
                            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                                Belanja lebih rapi dengan akun customer yang terpisah.
                            </h1>
                            <p className="max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
                                Login, register, dan recovery password customer kini memakai alur publik sendiri tanpa mengganggu auth admin.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 pt-6 sm:grid-cols-3">
                        {highlights.map((item) => {
                            const Icon = item.icon;

                            return (
                                <div
                                    key={item.title}
                                    className="rounded-2xl border border-slate-200/80 bg-slate-950/[0.02] p-4"
                                >
                                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                                        <Icon className="size-5" />
                                    </div>
                                    <h2 className="mt-4 text-sm font-semibold text-slate-950">
                                        {item.title}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        {item.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="flex items-center justify-center">
                    <div className="w-full max-w-xl rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur sm:p-8">
                        <div className="mb-8 space-y-3">
                            <p className="text-sm font-semibold tracking-[0.28em] text-slate-500 uppercase">
                                Customer access
                            </p>
                            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                                {title}
                            </h2>
                            <p className="text-sm leading-6 text-slate-600 sm:text-base">
                                {description}
                            </p>
                        </div>

                        {children}
                    </div>
                </section>
            </div>
        </div>
    );
}
