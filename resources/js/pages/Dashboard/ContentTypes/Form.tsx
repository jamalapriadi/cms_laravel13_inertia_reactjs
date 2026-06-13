import { Head, Link, useForm } from '@inertiajs/react';
import type React from 'react';
import { toast } from 'sonner';

import { index, store, update } from '@/actions/App/Http/Controllers/Dashboard/ContentTypeController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Textarea from '@/components/ui/textarea';
import type { DynamicContentType } from '@/types/dynamic-content';

interface Props {
    mode: 'create' | 'edit';
    contentType?: DynamicContentType;
}

interface FormData {
    name: string;
    slug: string;
    description: string;
    icon: string;
    is_active: boolean;
    sort_order: number;
}

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export default function Form({ mode, contentType }: Props) {
    const { data, setData, post, put, processing, errors } = useForm<FormData>({
        name: contentType?.name ?? '',
        slug: contentType?.slug ?? '',
        description: contentType?.description ?? '',
        icon: contentType?.icon ?? '',
        is_active: contentType?.is_active ?? true,
        sort_order: contentType?.sort_order ?? 0,
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        const callback = mode === 'create' ? post : put;
        const url =
            mode === 'create'
                ? store().url
                : update({ content_type: contentType?.id ?? '' }).url;

        callback(url, {
            preserveScroll: true,
            onStart: () =>
                toast.loading(
                    mode === 'create' ? 'Creating content type...' : 'Updating content type...',
                    { id: 'content-type' },
                ),
            onSuccess: () =>
                toast.success(
                    mode === 'create' ? 'Content type created.' : 'Content type updated.',
                    { id: 'content-type' },
                ),
            onError: () =>
                toast.error('Please check the form fields.', {
                    id: 'content-type',
                }),
        });
    };

    return (
        <>
            <Head title={mode === 'create' ? 'Create Content Type' : 'Edit Content Type'} />

            <div className="container mx-auto max-w-4xl space-y-8 px-6 py-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {mode === 'create' ? 'Create Content Type' : 'Edit Content Type'}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Define reusable dynamic content collections for the storefront and dashboard.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Name" required>
                            <Input
                                value={data.name}
                                onChange={(event) => {
                                    const nextName = event.target.value;
                                    setData('name', nextName);

                                    if (!data.slug || data.slug === slugify(data.name)) {
                                        setData('slug', slugify(nextName));
                                    }
                                }}
                                placeholder="Testimonials"
                            />
                            <Error message={errors.name} />
                        </Field>

                        <Field label="Slug" required>
                            <Input
                                value={data.slug}
                                onChange={(event) =>
                                    setData('slug', slugify(event.target.value))
                                }
                                placeholder="testimonials"
                            />
                            <Error message={errors.slug} />
                        </Field>

                        <Field label="Icon">
                            <Input
                                value={data.icon}
                                onChange={(event) => setData('icon', event.target.value)}
                                placeholder="message-square-quote"
                            />
                            <Error message={errors.icon} />
                        </Field>

                        <Field label="Sort Order">
                            <Input
                                type="number"
                                min={0}
                                value={data.sort_order}
                                onChange={(event) =>
                                    setData('sort_order', Number(event.target.value || 0))
                                }
                            />
                            <Error message={errors.sort_order} />
                        </Field>

                        <Field label="Description" className="md:col-span-2">
                            <Textarea
                                rows={4}
                                value={data.description}
                                onChange={(event) =>
                                    setData('description', event.target.value)
                                }
                                placeholder="Short explanation for this content type"
                            />
                            <Error message={errors.description} />
                        </Field>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                        <div>
                            <Label htmlFor="content-type-active">Active</Label>
                            <p className="text-xs text-muted-foreground">
                                Active content types appear in the dynamic content sidebar.
                            </p>
                        </div>
                        <Switch
                            id="content-type-active"
                            checked={data.is_active}
                            onCheckedChange={(checked) => setData('is_active', checked)}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link href={index().url}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? 'Saving...'
                                : mode === 'create'
                                  ? 'Create Content Type'
                                  : 'Update Content Type'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

function Field({
    label,
    required = false,
    className = '',
    children,
}: {
    label: string;
    required?: boolean;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={`space-y-2 ${className}`}>
            <Label>
                {label}
                {required ? ' *' : ''}
            </Label>
            {children}
        </div>
    );
}

function Error({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-xs text-destructive">{message}</p>;
}
