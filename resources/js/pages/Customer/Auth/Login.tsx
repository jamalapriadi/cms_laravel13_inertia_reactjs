import { Head, Link, useForm, usePage } from '@inertiajs/react';

import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register as registerRoute } from '@/routes/customer/auth';
import { store } from '@/routes/customer/auth/login';
import { request } from '@/routes/customer/auth/password';

type Props = {
    status?: string;
};

type LoginFormData = {
    email: string;
    password: string;
    remember: boolean;
};

export default function Login({ status }: Props) {
    const { customer_auth_config } = usePage<any>().props;

    const form = useForm<LoginFormData>({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(store().url, {
            preserveScroll: true,
            onFinish: () => form.reset('password'),
        });
    };

    return (
        <>
            <Head title="Customer Login" />

            <form onSubmit={submit} className="space-y-6">
                {status && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                        {status}
                    </div>
                )}

                <div className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={form.data.email}
                            onChange={(event) =>
                                form.setData('email', event.target.value)
                            }
                            autoComplete="email"
                            autoFocus
                            placeholder="customer@example.com"
                            aria-invalid={!!form.errors.email}
                        />
                        <InputError message={form.errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-3">
                            <Label htmlFor="password">Password</Label>
                            {customer_auth_config?.allow_password_reset && (
                                <Link
                                    href={request()}
                                    className="text-sm font-medium text-teal-700 underline-offset-4 transition hover:underline"
                                >
                                    Lupa password?
                                </Link>
                            )}
                        </div>

                        <PasswordInput
                            id="password"
                            value={form.data.password}
                            onChange={(event) =>
                                form.setData('password', event.target.value)
                            }
                            autoComplete="current-password"
                            placeholder="Masukkan password"
                            aria-invalid={!!form.errors.password}
                        />
                        <InputError message={form.errors.password} />
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <Checkbox
                            id="remember"
                            checked={form.data.remember}
                            onCheckedChange={(checked) =>
                                form.setData('remember', checked === true)
                            }
                        />
                        <Label htmlFor="remember" className="cursor-pointer">
                            Ingat saya di perangkat ini
                        </Label>
                    </div>

                    <Button
                        type="submit"
                        className="h-11 w-full"
                        disabled={form.processing}
                    >
                        {form.processing && <Spinner />}
                        Masuk ke dashboard customer
                    </Button>
                </div>

                {customer_auth_config?.allow_customer_registration && (
                    <p className="text-center text-sm text-slate-600">
                        Belum punya akun?{' '}
                        <Link
                            href={registerRoute()}
                            className="font-semibold text-slate-950 underline-offset-4 transition hover:underline"
                        >
                            Daftar sekarang
                        </Link>
                    </p>
                )}
            </form>
        </>
    );
}

Login.layout = {
    title: 'Masuk ke akun customer',
    description:
        'Gunakan email customer untuk mengakses dashboard belanja dan riwayat order Anda.',
};
