import { zodResolver } from '@hookform/resolvers/zod';
import { Head, Link, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes/customer';
import { update } from '@/routes/customer/password';

type Props = {
    email?: string;
    token?: string;
};

const recoveryPasswordSchema = z
    .object({
        token: z.string().min(1, 'Token reset password wajib diisi'),
        email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
        password: z.string().min(8, 'Password minimal 8 karakter'),
        password_confirmation: z.string().min(1, 'Konfirmasi password wajib diisi'),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: 'Konfirmasi password tidak sama',
        path: ['password_confirmation'],
    });

type RecoveryPasswordFormData = z.infer<typeof recoveryPasswordSchema>;

export default function RecoveryPassword({ email = '', token = '' }: Props) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RecoveryPasswordFormData>({
        resolver: zodResolver(recoveryPasswordSchema),
        defaultValues: {
            email,
            token,
            password: '',
            password_confirmation: '',
        },
    });

    const onSubmit = (data: RecoveryPasswordFormData) => {
        router.post(update().url, data, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Customer Recovery Password" />

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                <input type="hidden" {...register('token')} />
                <InputError message={errors.token?.message} />

                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" autoComplete="email" autoFocus placeholder="customer@example.com" {...register('email')} />
                    <InputError message={errors.email?.message} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password">Password baru</Label>
                    <PasswordInput id="password" autoComplete="new-password" placeholder="Password baru" {...register('password')} />
                    <InputError message={errors.password?.message} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password_confirmation">Konfirmasi password</Label>
                    <PasswordInput
                        id="password_confirmation"
                        autoComplete="new-password"
                        placeholder="Konfirmasi password"
                        {...register('password_confirmation')}
                    />
                    <InputError message={errors.password_confirmation?.message} />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Spinner />}
                    Simpan password baru
                </Button>

                <Link href={login()} className="text-center text-sm underline-offset-4 hover:underline">
                    Kembali ke login
                </Link>
            </form>
        </>
    );
}

RecoveryPassword.layout = {
    title: 'Recovery password',
    description: 'Buat password baru untuk akun customer Anda.',
};
