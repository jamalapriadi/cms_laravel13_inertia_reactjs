import { Head, Link, useForm, usePage } from '@inertiajs/react';

import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes/customer/auth';
import { store } from '@/routes/customer/auth/register';

type RegisterFormData = {
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
};

export default function Register() {
    const { customer_auth_config } = usePage<any>().props;

    const form = useForm<RegisterFormData>({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(store().url, {
            preserveScroll: true,
            onFinish: () => form.reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Customer Register" />

            <form onSubmit={submit} className="space-y-6">
                <div className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama lengkap</Label>
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            autoComplete="name"
                            autoFocus
                            placeholder="Nama customer"
                            aria-invalid={!!form.errors.name}
                        />
                        <InputError message={form.errors.name} />
                    </div>

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
                            placeholder="customer@example.com"
                            aria-invalid={!!form.errors.email}
                        />
                        <InputError message={form.errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Nomor telepon</Label>
                        <Input
                            id="phone"
                            value={form.data.phone}
                            onChange={(event) =>
                                form.setData('phone', event.target.value)
                            }
                            autoComplete="tel"
                            placeholder="081234567890"
                            aria-invalid={!!form.errors.phone}
                        />
                        <InputError message={form.errors.phone} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <PasswordInput
                            id="password"
                            value={form.data.password}
                            onChange={(event) =>
                                form.setData('password', event.target.value)
                            }
                            autoComplete="new-password"
                            placeholder="Minimal 8 karakter"
                            aria-invalid={!!form.errors.password}
                        />
                        <InputError message={form.errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
                            Konfirmasi password
                        </Label>
                        <PasswordInput
                            id="password_confirmation"
                            value={form.data.password_confirmation}
                            onChange={(event) =>
                                form.setData(
                                    'password_confirmation',
                                    event.target.value,
                                )
                            }
                            autoComplete="new-password"
                            placeholder="Ulangi password"
                            aria-invalid={!!form.errors.password_confirmation}
                        />
                        <InputError
                            message={form.errors.password_confirmation}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="h-11 w-full"
                        disabled={form.processing}
                    >
                        {form.processing && <Spinner />}
                        Buat akun customer
                    </Button>
                </div>

                {customer_auth_config?.allow_customer_login && (
                    <p className="text-center text-sm text-slate-600">
                        Sudah punya akun?{' '}
                        <Link
                            href={login()}
                            className="font-semibold text-slate-950 underline-offset-4 transition hover:underline"
                        >
                            Masuk di sini
                        </Link>
                    </p>
                )}
            </form>
        </>
    );
}

Register.layout = {
    title: 'Daftar akun customer',
    description:
        'Simpan data customer Anda sekarang agar checkout, pesanan, dan recovery password lebih mudah.',
};
