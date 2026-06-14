import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';

import {
    index as themesIndex,
    updateSettings,
} from '@/actions/App/Http/Controllers/Dashboard/ThemeController';
import MediaImagePicker from '@/components/media/MediaImagePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Textarea from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

interface ThemeItem {
    id: number;
    name: string;
    slug: string;
    version: string | null;
    author: string | null;
    description: string | null;
    screenshot: string | null;
    is_active: boolean;
}

interface ThemeSettingField {
    key: string;
    type: string;
    label: string;
    default: string | number | boolean | null;
    options: string[];
    value: string | number | boolean | null;
}

interface Props {
    theme: ThemeItem;
    settings: ThemeSettingField[];
}

export default function Customize({ theme, settings }: Props) {
    const defaults = settings.reduce<Record<string, string | number | boolean | null>>(
        (carry, field) => {
            carry[field.key] = field.value ?? field.default ?? null;

            return carry;
        },
        {},
    );

    const { data, setData, put, processing, errors } = useForm<{
        settings: Record<string, string | number | boolean | null>;
    }>({
        settings: defaults,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        put(updateSettings(theme.slug).url, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title={`Customize ${theme.name}`} />

            <div className="container mx-auto max-w-5xl space-y-8 px-6 py-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Link href={themesIndex().url}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Customize {theme.name}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Ubah setting theme dari manifest tanpa rebuild asset frontend.
                        </p>
                    </div>
                </div>

                <hr className="border-border" />

                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                        <div className="overflow-hidden rounded-xl border bg-muted/20">
                            {theme.screenshot ? (
                                <img
                                    src={theme.screenshot}
                                    alt={theme.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">
                                    No screenshot
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <p className="text-lg font-medium">{theme.name}</p>
                            <p className="font-mono text-xs text-muted-foreground">{theme.slug}</p>
                            <p className="text-sm text-muted-foreground">
                                {theme.description || 'Theme ini belum punya deskripsi.'}
                            </p>
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                {theme.is_active ? 'Active theme' : 'Inactive theme'}
                            </p>
                        </div>
                    </div>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm"
                >
                    {settings.length === 0 ? (
                        <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                            Theme ini belum mendefinisikan field setting di <span className="font-mono">theme.json</span>.
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2">
                            {settings.map((field) => (
                                <div
                                    key={field.key}
                                    className={field.type === 'textarea' || field.type === 'media'
                                        ? 'md:col-span-2'
                                        : ''}
                                >
                                    <Field
                                        field={field}
                                        value={data.settings[field.key] ?? null}
                                        error={errors[`settings.${field.key}` as keyof typeof errors] as string | undefined}
                                        onChange={(value) =>
                                            setData('settings', {
                                                ...data.settings,
                                                [field.key]: value,
                                            })
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <Link href={themesIndex().url}>
                            <Button type="button" variant="outline">
                                Back
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="gap-2">
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            Save Theme Settings
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

Customize.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Themes', href: '/my-admin/dashboard/themes' }]}>
        {page}
    </AppLayout>
);

function Field({
    field,
    value,
    error,
    onChange,
}: {
    field: ThemeSettingField;
    value: string | number | boolean | null;
    error?: string;
    onChange: (value: string | number | boolean | null) => void;
}) {
    if (field.type === 'media') {
        return (
            <div className="space-y-2">
                <Label>{field.label}</Label>
                <MediaImagePicker
                    value={typeof value === 'string' ? value : null}
                    onChange={onChange}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
        );
    }

    if (field.type === 'textarea') {
        return (
            <div className="space-y-2">
                <Label>{field.label}</Label>
                <Textarea
                    rows={5}
                    value={typeof value === 'string' ? value : ''}
                    onChange={(event) => onChange(event.target.value)}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
        );
    }

    if (field.type === 'boolean') {
        return (
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
                <div>
                    <Label>{field.label}</Label>
                    <p className="text-xs text-muted-foreground">True / false toggle.</p>
                </div>
                <Switch checked={Boolean(value)} onCheckedChange={onChange} />
            </div>
        );
    }

    if (field.type === 'select') {
        return (
            <div className="space-y-2">
                <Label>{field.label}</Label>
                <select
                    value={typeof value === 'string' ? value : String(value ?? '')}
                    onChange={(event) => onChange(event.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                    {field.options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <Label>{field.label}</Label>
            <Input
                type={field.type === 'color' ? 'color' : field.type === 'number' ? 'number' : 'text'}
                value={
                    typeof value === 'string' || typeof value === 'number'
                        ? value
                        : ''
                }
                onChange={(event) =>
                    onChange(
                        field.type === 'number'
                            ? event.target.value === ''
                                ? null
                                : Number(event.target.value)
                            : event.target.value,
                    )
                }
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
