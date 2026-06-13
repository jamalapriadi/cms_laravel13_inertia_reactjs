import { Head, Link, useForm, usePage } from '@inertiajs/react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes/customer/auth';
import { email } from '@/routes/customer/auth/password';

type Props = {
    status?: string;
};

type ForgotPasswordFormData = {
    email: string;
};

export default function ForgotPassword({ status }: Props) {
    const { customer_auth_config } = usePage<any>().props;

    const form = useForm<ForgotPasswordFormData>({
        email: '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(email().url, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Customer Forgot Password" />

            <form onSubmit={submit} className="space-y-6">
                {status && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                        {status}
                    </div>
                )}

                <div className="grid gap-2">
                    <Label htmlFor="email">Email customer</Label>
                    <Input
                        id="email"
                        type="email"
                        value={form.data.email}
                        onChange={(event) => form.setData('email', event.target.value)}
                        autoComplete="email"
                        autoFocus
                        placeholder="customer@example.com"
                        aria-invalid={!!form.errors.email}
                    />
                    <InputError message={form.errors.email} />
                </div>

                <Button type="submit" className="h-11 w-full" disabled={form.processing}>
                    {form.processing && <Spinner />}
                    Kirim link recovery
                </Button>

                {customer_auth_config?.allow_customer_login && (
                    <Link href={login()} className="block text-center text-sm font-medium text-slate-700 underline-offset-4 transition hover:underline">
                        Kembali ke halaman login
                    </Link>
                )}
            </form>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Butuh recovery password?',
    description: 'Masukkan email customer yang terdaftar dan kami akan kirim tautan reset ke inbox Anda.',
};
