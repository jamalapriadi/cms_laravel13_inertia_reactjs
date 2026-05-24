import { zodResolver } from '@hookform/resolvers/zod';
import { Head, Link, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register as registerRoute } from '@/routes/customer';
import { store } from '@/routes/customer/login';
import { request } from '@/routes/customer/password';

type Props = {
    status?: string;
};

const loginSchema = z.object({
    email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
    password: z.string().min(1, 'Password wajib diisi').min(6, 'Password minimal 6 karakter'),
    remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login({ status }: Props) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            remember: false,
        },
    });

    const remember = watch('remember');

    const onSubmit = (data: LoginFormData) => {
        router.post(store().url, data, {
            preserveScroll: true,
            onFinish: () => setValue('password', ''),
        });
    };

    return (
        <>
            <Head title="Customer Login" />

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            autoComplete="email"
                            autoFocus
                            placeholder="customer@example.com"
                            aria-invalid={!!errors.email}
                            {...register('email')}
                        />
                        <InputError message={errors.email?.message} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center gap-3">
                            <Label htmlFor="password">Password</Label>
                            <Link href={request()} className="ml-auto text-sm underline-offset-4 hover:underline">
                                Lupa password?
                            </Link>
                        </div>
                        <PasswordInput
                            id="password"
                            autoComplete="current-password"
                            placeholder="Password"
                            aria-invalid={!!errors.password}
                            {...register('password')}
                        />
                        <InputError message={errors.password?.message} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="remember"
                            checked={remember}
                            onCheckedChange={(checked) => setValue('remember', checked === true)}
                        />
                        <Label htmlFor="remember">Ingat saya</Label>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting && <Spinner />}
                        Masuk
                    </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                    Belum punya akun?{' '}
                    <Link href={registerRoute()} className="font-medium underline-offset-4 hover:underline">
                        Daftar
                    </Link>
                </p>
            </form>

            {status && <p className="mt-6 text-center text-sm font-medium text-green-600">{status}</p>}
        </>
    );
}

Login.layout = {
    title: 'Masuk sebagai customer',
    description: 'Gunakan email dan password customer untuk melanjutkan.',
};
