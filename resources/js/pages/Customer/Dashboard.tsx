import { Head } from '@inertiajs/react';
import { Mail, Phone, ShoppingBag, ShoppingCart } from 'lucide-react';

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
};

export default function CustomerDashboard({ customer, summary }: Props) {
    return (
        <>
            <Head title="Customer Dashboard" />

            <div className="flex flex-col gap-6">
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
