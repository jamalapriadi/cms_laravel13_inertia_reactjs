import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

// import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email wajib diisi')
        .email('Format email tidak valid'),

    password: z
        .string()
        .min(1, 'Password wajib diisi')
        .min(6, 'Password minimal 6 karakter'),

    remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login({ status, canResetPassword }: Props) {
    const {
        register: formRegister,
        handleSubmit,
        setValue,
        setError,
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

            onFinish: () => {
                setValue('password', '');
            },
            onError: (errors) => {
                if (errors.email) {
                    setError('email', { type: 'server', message: errors.email });
                }
                if (errors.password) {
                    setError('password', { type: 'server', message: errors.password });
                }
            },
        });
    };

    return (
        <>
            <Head title="Log in" />

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-6"
            >
                <div className="grid gap-6">
                    {/* EMAIL */}
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>

                        <Input
                            id="email"
                            type="email"
                            autoFocus
                            autoComplete="email"
                            placeholder="email@example.com"
                            aria-invalid={!!errors.email}
                            {...formRegister('email')}
                        />

                        <InputError message={errors.email?.message} />
                    </div>

                    {/* PASSWORD */}
                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>

                            {canResetPassword && (
                                <TextLink
                                    href={request()}
                                    className="ml-auto text-sm"
                                >
                                    Forgot password?
                                </TextLink>
                            )}
                        </div>

                        <PasswordInput
                            id="password"
                            autoComplete="current-password"
                            placeholder="Password"
                            aria-invalid={!!errors.password}
                            {...formRegister('password')}
                        />

                        <InputError message={errors.password?.message} />
                    </div>

                    {/* REMEMBER */}
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="remember"
                            checked={remember}
                            onCheckedChange={(checked) =>
                                setValue('remember', checked === true)
                            }
                        />

                        <Label htmlFor="remember">Remember me</Label>
                    </div>

                    {/* BUTTON */}
                    <Button
                        type="submit"
                        className="mt-4 w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting && <Spinner />}
                        Log in
                    </Button>
                </div>

                {/* {canRegister && (
                    <div className="text-center text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <TextLink href={register()}>Sign up</TextLink>
                    </div>
                )} */}
            </form>

            {status && (
                <div className="mt-6 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Log in to your account',
    description: 'Enter your email and password below to log in',
};
