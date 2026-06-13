import { Head, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

import type { OptionItem } from '@/types/option';

interface Props {
    options: OptionItem[];
}

export default function Customer({ options }: Props) {
    const [initialized, setInitialized] = useState(false);

    const { data, setData, post, processing } = useForm({
        allow_customer_registration: false,
        allow_customer_login: false,
        allow_password_reset: false,
        require_email_verification: false,
    });

    /**
     * ✅ Mapping options → state (clean & safe)
     */
    useEffect(() => {
        if (!options || initialized) {
            return;
        }

        const mapped: Partial<typeof data> = {};

        for (const item of options) {
            if (item.key in data) {
                let value: any = item.value;

                if (value === '1') {
                    value = true;
                }

                if (value === '0') {
                    value = false;
                }

                mapped[item.key as keyof typeof data] = value ?? false;
            }
        }

        setData((prev) => ({ ...prev, ...mapped }));
        setInitialized(true);
    }, [options, initialized, setData]);

    /**
     * ✅ Submit
     */
    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/my-admin/dashboard/options', {
            preserveScroll: true,
            onStart: () => toast.loading('Saving...', { id: 'save' }),
            onSuccess: () =>
                toast.success('Customer settings updated', { id: 'save' }),
            onError: () => toast.error('Failed to save', { id: 'save' }),
        });
    };

    if (!initialized) {
        return null;
    }

    return (
        <>
            <Head title="Customer Settings" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">Customer Settings</h1>
                    <p className="text-muted-foreground">
                        Configure how customers interact with your platform.
                    </p>
                </div>

                <hr />

                <form onSubmit={submit} className="space-y-12">
                    {/* AUTH SETTINGS */}
                    <section className="grid grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold">
                                Authentication Settings
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Control registration, login, and verification.
                            </p>
                        </div>

                        <div className="col-span-2 space-y-4 rounded-xl bg-card p-6 shadow">
                            <SwitchField
                                label="Allow Customer Registration"
                                description="Jika aktif, customer bisa membuat akun baru melalui /auth/register."
                                checked={data.allow_customer_registration}
                                onChange={(val) =>
                                    setData('allow_customer_registration', val)
                                }
                            />

                            <SwitchField
                                label="Allow Customer Login"
                                description="Jika aktif, customer bisa login melalui /auth/login."
                                checked={data.allow_customer_login}
                                onChange={(val) =>
                                    setData('allow_customer_login', val)
                                }
                            />

                            <SwitchField
                                label="Allow Password Reset"
                                description="Jika aktif, customer bisa menggunakan fitur lupa password dan recovery password."
                                checked={data.allow_password_reset}
                                onChange={(val) =>
                                    setData('allow_password_reset', val)
                                }
                            />

                            <SwitchField
                                label="Require Email Verification"
                                description="Jika aktif, customer harus verifikasi email sebelum bisa mengakses dashboard."
                                checked={data.require_email_verification}
                                onChange={(val) =>
                                    setData('require_email_verification', val)
                                }
                            />
                        </div>
                    </section>

                    {/* SUBMIT */}
                    <div className="flex justify-end">
                        <Button disabled={processing}>
                            {processing ? 'Saving...' : 'Update Settings'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

/**
 * ✅ Reusable Switch Field (biar DRY & konsisten)
 */
function SwitchField({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (val: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
            <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            <Checkbox
                checked={checked}
                onCheckedChange={(val) => onChange(val === true)}
            />
        </div>
    );
}

/**
 * ✅ Layout (konsisten semua halaman config)
 */
Customer.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan',
            href: '/my-admin/dashboard/config/main',
        },
        {
            title: 'Customer',
            href: '/my-admin/dashboard/config/customer',
        },
    ],
};
