import { Head, useForm } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

import { toast } from 'sonner';

import MediaImagePicker from '@/components/media/MediaImagePicker';
import { Button } from '@/components/ui/button';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import MonacoEditor from '@/components/ui/MonacoEditor';
import TinyEditor from '@/components/ui/TinyEditor';

import type { OptionItem } from '@/types/option';

interface Props {
    options: OptionItem[];
}

const assetFields = [
    'favicon_ico',
    'logo',
    'logo_footer',
    'logo_mobile',
] as const;

const legacyAssetUrlFields = assetFields.map((field) => `${field}_url`);

export default function General({ options }: Props) {
    const initialized = useRef(false);

    const { data, setData, post, processing } = useForm({
        site_title: '',
        tagline: '',
        description: '',
        short_description: '',
        users_can_register: false,
        alamat_instansi: '',
        email_instansi: '',
        phone_instansi: '',
        whatsapp_instansi: '',
        instansi_map: '',
        marketplace: [] as any[],
        social_media: [] as any[],
        favicon_ico: null as File | null,
        favicon_ico_url: '',

        logo: null as File | null,
        logo_url: '',

        logo_footer: null as File | null,
        logo_footer_url: '',

        logo_mobile: null as File | null,
        logo_mobile_url: '',
    });

    /**
     * ✅ Mapping options → form state
     * Hanya jalan sekali saat pertama load
     */
    useEffect(() => {
        if (!options || initialized.current) {
            return;
        }

        const mapped: any = {};

        options.forEach((item) => {
            if (item.key === 'marketplace') {
                mapped.marketplace =
                    typeof item.value === 'string'
                        ? JSON.parse(item.value)
                        : (item.value ?? []);

                return;
            }

            if (item.key === 'social_media') {
                mapped.social_media =
                    typeof item.value === 'string'
                        ? JSON.parse(item.value)
                        : (item.value ?? []);

                return;
            }

            if (
                assetFields.includes(item.key as (typeof assetFields)[number])
            ) {
                mapped[`${item.key}_url`] = item.value ?? '';

                return;
            }

            if (legacyAssetUrlFields.includes(item.key)) {
                mapped[item.key] = item.value ?? '';

                return;
            }

            if (item.key in data) {
                let value: any = item.value;

                if (value === '1') {
                    value = true;
                } else if (value === '0') {
                    value = false;
                }

                mapped[item.key] = value ?? '';
            }
        });

        setData((prev) => ({
            ...prev,
            ...mapped,
        }));

        initialized.current = true;
    }, [options, setData, data]);

    /**
     * ✅ Submit Handler
     */
    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/my-admin/dashboard/options', {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => toast.loading('Saving...', { id: 'save' }),
            onSuccess: () => toast.success('Settings updated', { id: 'save' }),
            onError: () => toast.error('Failed to save', { id: 'save' }),
        });
    };

    const handleMarketplaceChange = (index: number, value: string) => {
        const updated = [...data.marketplace];
        updated[index].value = value;

        setData('marketplace', updated);
    };

    const deleteMarketplace = (index: number) => {
        const updated = data.marketplace.filter(
            (_: any, i: number) => i !== index,
        );

        setData('marketplace', updated);
    };

    const addMarketplace = () => {
        const updated = [
            ...data.marketplace,
            {
                display_name: 'Marketplace',
                icon: '',
                value: '',
            },
        ];

        setData('marketplace', updated);
    };

    const handleSocialChange = (index: number, value: string) => {
        const updated = [...data.social_media];
        updated[index].value = value;

        setData('social_media', updated);
    };

    const deleteSocial = (index: number) => {
        const updated = data.social_media.filter(
            (_: any, i: number) => i !== index,
        );

        setData('social_media', updated);
    };

    const addSocial = () => {
        const updated = [
            ...data.social_media,
            {
                key: `custom_${Date.now()}`,
                display_name: 'Custom Social',
                icon: '',
                value: '',
            },
        ];

        setData('social_media', updated);
    };

    const setAsset = (
        field: 'favicon_ico' | 'logo' | 'logo_footer' | 'logo_mobile',
        path: string | null,
    ) => {
        setData((prev) => ({
            ...prev,
            [field]: null,
            [`${field}_url`]: path ?? '',
        }));
    };
    /**
     * ✅ Prevent TinyMCE render sebelum data siap
     */

    if (!initialized) {
        return null;
    }

    return (
        <>
            <Head title="General" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                <div className="mx-auto max-w-7xl space-y-10 px-6 py-10">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold">General Settings</h1>
                        <p className="text-muted-foreground">
                            Manage your website configuration
                        </p>
                    </div>
                    <hr />

                    <form onSubmit={submit} className="space-y-12">
                        {/* Website Section */}
                        <section className="grid grid-cols-3 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    About your website
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Information about your website.
                                </p>
                            </div>

                            <div className="col-span-2 space-y-6 rounded-xl bg-card p-6 shadow">
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="site_title">
                                        Site Title
                                    </label>
                                    <Input
                                        value={data.site_title}
                                        placeholder="Site Title"
                                        onChange={(e) =>
                                            setData(
                                                'site_title',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="tagline">Tagline</label>
                                    <Input
                                        value={data.tagline}
                                        placeholder="Tagline"
                                        onChange={(e) =>
                                            setData('tagline', e.target.value)
                                        }
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="short_description">
                                        Short Description
                                    </label>
                                    <Input
                                        value={data.short_description}
                                        placeholder="Short Description"
                                        onChange={(e) =>
                                            setData(
                                                'short_description',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        You can view this information on the
                                        About page on your website.
                                    </p>
                                </div>

                                {/* ✅ TinyMCE Fully Controlled */}
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="description">
                                        Description
                                    </label>
                                    <TinyEditor
                                        value={data.description}
                                        onChange={(val) =>
                                            setData('description', val)
                                        }
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        You can view this information on the
                                        About page on your website.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="users_can_register">
                                        Users Can Register
                                    </label>
                                    <Checkbox
                                        checked={!!data.users_can_register}
                                        onCheckedChange={(checked) =>
                                            setData(
                                                'users_can_register',
                                                checked === true,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </section>

                        <hr />

                        {/* Instansi Section */}
                        <section className="grid grid-cols-3 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    About your instansi
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Institution information.
                                </p>
                            </div>

                            <div className="col-span-2 space-y-6 rounded-xl bg-card p-6 shadow">
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="alamat_instansi">
                                        Alamat Instansi
                                    </label>
                                    <Input
                                        value={data.alamat_instansi}
                                        placeholder="Alamat Instansi"
                                        onChange={(e) =>
                                            setData(
                                                'alamat_instansi',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="email_instansi">
                                        Email Instansi
                                    </label>
                                    <Input
                                        value={data.email_instansi}
                                        placeholder="Email Instansi"
                                        onChange={(e) =>
                                            setData(
                                                'email_instansi',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="phone_instansi">
                                        Phone Instansi
                                    </label>
                                    <Input
                                        value={data.phone_instansi}
                                        placeholder="Phone Instansi"
                                        onChange={(e) =>
                                            setData(
                                                'phone_instansi',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="whatsapp_instansi">
                                        Whatsapp Instansi
                                    </label>
                                    <Input
                                        value={data.whatsapp_instansi}
                                        placeholder="Whatsapp Instansi"
                                        onChange={(e) =>
                                            setData(
                                                'whatsapp_instansi',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="instansi_map">
                                        Instansi Map
                                    </label>
                                    <MonacoEditor
                                        value={data.instansi_map || ''}
                                        onChange={(val) =>
                                            setData('instansi_map', val)
                                        }
                                        language="php"
                                    />
                                </div>
                            </div>
                        </section>

                        <hr />
                        <section className="grid grid-cols-3 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    Assets
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    The logo and cover image of your website
                                    that will be visible on your site. This
                                    assets will appear on your invoices.
                                </p>
                            </div>

                            <div className="col-span-2 space-y-8 rounded-xl bg-card p-6 shadow">
                                {/* Favicon */}
                                <div className="flex flex-col gap-1">
                                    <MediaImagePicker
                                        label="Favicon Ico"
                                        value={data.favicon_ico_url}
                                        onChange={(path) =>
                                            setAsset('favicon_ico', path)
                                        }
                                    />
                                </div>

                                {/* Logo */}
                                <div className="flex flex-col gap-1">
                                    <MediaImagePicker
                                        label="Logo"
                                        value={data.logo_url}
                                        onChange={(path) =>
                                            setAsset('logo', path)
                                        }
                                    />
                                </div>

                                {/* Logo Footer */}
                                <div className="flex flex-col gap-1">
                                    <MediaImagePicker
                                        label="Logo Footer"
                                        value={data.logo_footer_url}
                                        onChange={(path) =>
                                            setAsset('logo_footer', path)
                                        }
                                    />
                                </div>

                                {/* Logo Mobile */}
                                <div className="flex flex-col gap-1">
                                    <MediaImagePicker
                                        label="Logo Mobile"
                                        value={data.logo_mobile_url}
                                        onChange={(path) =>
                                            setAsset('logo_mobile', path)
                                        }
                                    />
                                </div>
                            </div>
                        </section>

                        <hr />
                        <section className="grid grid-cols-3 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    Social links
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Information about your different accounts on
                                    social networks. Users will be able to
                                    contact you directly on your official pages.
                                </p>
                            </div>

                            <div className="col-span-2 space-y-6 rounded-xl bg-card p-6 shadow">
                                {data.social_media?.length > 0 ? (
                                    data.social_media.map(
                                        (item: any, index: number) => (
                                            <div
                                                key={index}
                                                className="flex flex-col gap-2 border-b pb-4"
                                            >
                                                <label className="font-medium">
                                                    {item.display_name}
                                                </label>

                                                <div className="flex items-center gap-2">
                                                    {/* Icon */}
                                                    <div
                                                        className="flex h-10 w-10 items-center justify-center rounded-md border"
                                                        dangerouslySetInnerHTML={{
                                                            __html: item.icon,
                                                        }}
                                                    />

                                                    {/* Input */}
                                                    <Input
                                                        value={item.value || ''}
                                                        placeholder="Social Media URL"
                                                        onChange={(e) =>
                                                            handleSocialChange(
                                                                index,
                                                                e.target.value,
                                                            )
                                                        }
                                                    />

                                                    {/* Delete */}
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            deleteSocial(index)
                                                        }
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        ),
                                    )
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No social media available.
                                    </p>
                                )}

                                {/* Add Button */}
                                <div className="pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addSocial}
                                        className="cursor-pointer"
                                    >
                                        + Add Social Media
                                    </Button>
                                </div>
                            </div>
                        </section>

                        <hr />
                        <section className="grid grid-cols-3 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    Marketplace
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Information about your different accounts on
                                    Marketplace. Users will be able to contact
                                    you directly on your official pages.
                                </p>
                            </div>

                            <div className="col-span-2 space-y-6 rounded-xl bg-card p-6 shadow">
                                {data.marketplace?.length > 0 ? (
                                    data.marketplace.map(
                                        (item: any, index: number) => (
                                            <div
                                                key={index}
                                                className="flex flex-col gap-2 border-b pb-4"
                                            >
                                                <label className="font-medium">
                                                    {item.display_name}
                                                </label>

                                                <div className="flex items-center gap-2">
                                                    {/* Icon */}
                                                    <div
                                                        className="flex h-10 w-10 items-center justify-center rounded-md border"
                                                        dangerouslySetInnerHTML={{
                                                            __html: item.icon,
                                                        }}
                                                    />

                                                    {/* Input */}
                                                    <Input
                                                        value={item.value || ''}
                                                        placeholder="Marketplace URL"
                                                        onChange={(e) =>
                                                            handleMarketplaceChange(
                                                                index,
                                                                e.target.value,
                                                            )
                                                        }
                                                    />

                                                    {/* Delete */}
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            deleteMarketplace(
                                                                index,
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        ),
                                    )
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No marketplace data available.
                                    </p>
                                )}

                                {/* ✅ Add Button */}
                                <div className="pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addMarketplace}
                                        className="cursor-pointer"
                                    >
                                        + Add Marketplace
                                    </Button>
                                </div>
                            </div>
                        </section>

                        {/* Submit */}
                        <div className="flex justify-end">
                            <Button disabled={processing} type="submit">
                                {processing
                                    ? 'Saving...'
                                    : 'Update Information'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

/**
 * ✅ FIX: Layout Breadcrumbs
 */
General.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan',
            href: '/my-admin/dashboard/config/main', // ❗ FIXED (bukan ConfigMain())
        },
        {
            title: 'General',
            href: '/my-admin/dashboard/config/general', // ❗ FIXED (bukan ConfigMain())
        },
    ],
};
