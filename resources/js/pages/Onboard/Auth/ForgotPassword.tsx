import { zodResolver } from '@hookform/resolvers/zod';
import { Head, Link, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes/customer';
import { email } from '@/routes/customer/password';

type Props = {
    status?: string;
};

const forgotPasswordSchema = z.object({
    email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword({ status }: Props) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
    });

    const onSubmit = (data: ForgotPasswordFormData) => {
        router.post(email().url, data, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Customer Forgot Password" />

            {status && <p className="mb-6 text-sm font-medium text-green-600">{status}</p>}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" autoComplete="email" autoFocus placeholder="customer@example.com" {...register('email')} />
                    <InputError message={errors.email?.message} />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Spinner />}
                    Kirim link reset
                </Button>

                <Link href={login()} className="text-center text-sm underline-offset-4 hover:underline">
                    Kembali ke login
                </Link>
            </form>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Lupa password',
    description: 'Masukkan email customer untuk menerima link reset password.',
};
