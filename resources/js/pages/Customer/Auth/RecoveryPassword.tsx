import { Head, Link, useForm } from '@inertiajs/react';

import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes/customer/auth';
import { store } from '@/routes/customer/auth/password';

type Props = {
    email?: string;
    token: string;
};

type RecoveryPasswordFormData = {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
};

export default function RecoveryPassword({ email = '', token }: Props) {
    const form = useForm<RecoveryPasswordFormData>({
        email,
        token,
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
            <Head title="Customer Recovery Password" />

            <form onSubmit={submit} className="space-y-6">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
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

                <div className="grid gap-2">
                    <Label htmlFor="password">Password baru</Label>
                    <PasswordInput
                        id="password"
                        value={form.data.password}
                        onChange={(event) => form.setData('password', event.target.value)}
                        autoComplete="new-password"
                        placeholder="Masukkan password baru"
                        aria-invalid={!!form.errors.password}
                    />
                    <InputError message={form.errors.password} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password_confirmation">Konfirmasi password</Label>
                    <PasswordInput
                        id="password_confirmation"
                        value={form.data.password_confirmation}
                        onChange={(event) => form.setData('password_confirmation', event.target.value)}
                        autoComplete="new-password"
                        placeholder="Ulangi password baru"
                        aria-invalid={!!form.errors.password_confirmation}
                    />
                    <InputError message={form.errors.password_confirmation} />
                </div>

                <Button type="submit" className="h-11 w-full" disabled={form.processing}>
                    {form.processing && <Spinner />}
                    Simpan password baru
                </Button>

                <Link href={login()} className="block text-center text-sm font-medium text-slate-700 underline-offset-4 transition hover:underline">
                    Kembali ke login customer
                </Link>
            </form>
        </>
    );
}

RecoveryPassword.layout = {
    title: 'Atur ulang password customer',
    description: 'Gunakan password baru yang aman untuk melanjutkan akses ke dashboard customer Anda.',
};
