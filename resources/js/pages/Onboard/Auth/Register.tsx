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
import { store } from '@/routes/customer/register';

const registerSchema = z
    .object({
        name: z.string().min(1, 'Nama wajib diisi').max(255, 'Nama maksimal 255 karakter'),
        email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
        phone: z.string().max(30, 'Nomor telepon maksimal 30 karakter').optional(),
        password: z.string().min(8, 'Password minimal 8 karakter'),
        password_confirmation: z.string().min(1, 'Konfirmasi password wajib diisi'),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: 'Konfirmasi password tidak sama',
        path: ['password_confirmation'],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            password: '',
            password_confirmation: '',
        },
    });

    const onSubmit = (data: RegisterFormData) => {
        router.post(store().url, data, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Customer Register" />

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama</Label>
                        <Input id="name" autoComplete="name" autoFocus placeholder="Nama lengkap" {...register('name')} />
                        <InputError message={errors.name?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" autoComplete="email" placeholder="customer@example.com" {...register('email')} />
                        <InputError message={errors.email?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Nomor telepon</Label>
                        <Input id="phone" autoComplete="tel" placeholder="081234567890" {...register('phone')} />
                        <InputError message={errors.phone?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <PasswordInput id="password" autoComplete="new-password" placeholder="Password" {...register('password')} />
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
                        Daftar
                    </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                    Sudah punya akun?{' '}
                    <Link href={login()} className="font-medium underline-offset-4 hover:underline">
                        Masuk
                    </Link>
                </p>
            </form>
        </>
    );
}

Register.layout = {
    title: 'Daftar customer',
    description: 'Buat akun customer untuk mulai berbelanja.',
};
