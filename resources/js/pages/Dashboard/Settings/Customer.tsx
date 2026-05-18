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
        customer_can_register: false,
        customer_can_login: false,
        customer_can_reset_password: false,
        customer_can_verify_email: false,
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

        post('/dashboard/options', {
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
                    <p className="text-gray-500">
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
                            <p className="text-sm text-gray-500">
                                Control registration, login, and verification.
                            </p>
                        </div>

                        <div className="col-span-2 space-y-4 rounded-xl bg-white p-6 shadow">
                            <SwitchField
                                label="Allow Customer Registration"
                                description="Enable public customer sign up."
                                checked={data.customer_can_register}
                                onChange={(val) =>
                                    setData('customer_can_register', val)
                                }
                            />

                            <SwitchField
                                label="Allow Customer Login"
                                description="Enable login access."
                                checked={data.customer_can_login}
                                onChange={(val) =>
                                    setData('customer_can_login', val)
                                }
                            />

                            <SwitchField
                                label="Allow Password Reset"
                                description="Customers can reset forgotten passwords."
                                checked={data.customer_can_reset_password}
                                onChange={(val) =>
                                    setData('customer_can_reset_password', val)
                                }
                            />

                            <SwitchField
                                label="Require Email Verification"
                                description="Customers must verify email before activation."
                                checked={data.customer_can_verify_email}
                                onChange={(val) =>
                                    setData('customer_can_verify_email', val)
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
        <div className="flex items-center justify-between border-b border-gray-200 py-3 last:border-0">
            <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-gray-500">{description}</p>
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
            href: '/dashboard/config/main',
        },
        {
            title: 'Customer',
            href: '/dashboard/config/customer',
        },
    ],
};
