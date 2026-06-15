import { Head, Link, useForm } from '@inertiajs/react';
import type React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

import DynamicFieldInput from '@/components/dynamic-content/DynamicFieldInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Textarea from '@/components/ui/textarea';
import type {
    DynamicContentFormData,
    DynamicContentFieldFormValue,
    DynamicContentType,
    DynamicFieldGroup,
} from '@/types/dynamic-content';

interface Props {
    mode: 'create' | 'edit';
    contentType: DynamicContentType;
    fieldGroups: DynamicFieldGroup[];
    form: DynamicContentFormData;
    submitUrl: string;
}

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export default function Form({
    mode,
    contentType,
    fieldGroups,
    form,
    submitUrl,
}: Props) {
    const [slugTouched, setSlugTouched] = useState(mode === 'edit');
    const { data, setData, post, put, processing, errors } =
        useForm<DynamicContentFormData>({
            title: form.title,
            slug: form.slug,
            excerpt: form.excerpt,
            status: form.status,
            published_at: form.published_at,
            sort_order: form.sort_order,
            fields: form.fields,
        });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        const callback = mode === 'create' ? post : put;

        callback(submitUrl, {
            preserveScroll: true,
            onStart: () =>
                toast.loading(
                    mode === 'create'
                        ? 'Creating content entry...'
                        : 'Updating content entry...',
                    { id: 'dynamic-content-entry' },
                ),
            onSuccess: () =>
                toast.success(
                    mode === 'create'
                        ? 'Content entry created.'
                        : 'Content entry updated.',
                    { id: 'dynamic-content-entry' },
                ),
            onError: () =>
                toast.error('Please check the form fields.', {
                    id: 'dynamic-content-entry',
                }),
        });
    };

    const setFieldValue = (
        name: string,
        value: DynamicContentFieldFormValue,
    ) => {
        setData('fields', {
            ...data.fields,
            [name]: value,
        });
    };

    return (
        <>
            <Head
                title={
                    mode === 'create'
                        ? `Create ${contentType.name}`
                        : `Edit ${contentType.name}`
                }
            />

            <div className="container mx-auto max-w-6xl space-y-8 px-6 py-8">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {mode === 'create'
                                ? `Create ${contentType.name}`
                                : `Edit ${contentType.name}`}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Fill the core entry fields and the dynamic field
                            groups configured for {contentType.name}.
                        </p>
                    </div>
                    <Link
                        href={`/my-admin/dashboard/content/${contentType.slug}`}
                    >
                        <Button type="button" variant="outline">
                            Back to List
                        </Button>
                    </Link>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                        <section className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    label="Title"
                                    required
                                    className="md:col-span-2"
                                >
                                    <Input
                                        value={data.title}
                                        onChange={(event) => {
                                            const nextTitle =
                                                event.target.value;
                                            setData('title', nextTitle);

                                            if (!slugTouched) {
                                                setData(
                                                    'slug',
                                                    slugify(nextTitle),
                                                );
                                            }
                                        }}
                                        placeholder={`Title for ${contentType.name}`}
                                    />
                                    <Error message={errors.title} />
                                </Field>

                                <Field label="Slug" required>
                                    <Input
                                        value={data.slug}
                                        onChange={(event) => {
                                            setSlugTouched(true);
                                            setData(
                                                'slug',
                                                slugify(event.target.value),
                                            );
                                        }}
                                        placeholder={contentType.slug}
                                    />
                                    <Error message={errors.slug} />
                                </Field>

                                <Field label="Sort Order">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={data.sort_order}
                                        onChange={(event) =>
                                            setData(
                                                'sort_order',
                                                Number(event.target.value || 0),
                                            )
                                        }
                                    />
                                    <Error message={errors.sort_order} />
                                </Field>

                                <Field
                                    label="Excerpt"
                                    className="md:col-span-2"
                                >
                                    <Textarea
                                        rows={4}
                                        value={data.excerpt}
                                        onChange={(event) =>
                                            setData(
                                                'excerpt',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Optional short summary"
                                    />
                                    <Error message={errors.excerpt} />
                                </Field>
                            </div>

                            {fieldGroups.map((group) => (
                                <section key={group.id} className="space-y-4">
                                    <div className="space-y-1">
                                        <h2 className="text-base font-semibold">
                                            {group.name}
                                        </h2>
                                        {group.description && (
                                            <p className="text-sm text-muted-foreground">
                                                {group.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        {group.fields.map((field) => (
                                            <DynamicFieldInput
                                                key={field.id}
                                                field={field}
                                                value={data.fields[field.name]}
                                                error={
                                                    errors[
                                                        `fields.${field.name}` as keyof typeof errors
                                                    ] as string | undefined
                                                }
                                                onChange={(value) =>
                                                    setFieldValue(
                                                        field.name,
                                                        value as DynamicContentFieldFormValue,
                                                    )
                                                }
                                            />
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </section>

                        <aside className="space-y-6">
                            <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
                                <h2 className="text-base font-semibold">
                                    Publishing
                                </h2>

                                <Field label="Status" required>
                                    <Select
                                        value={data.status}
                                        onValueChange={(value) =>
                                            setData('status', value)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">
                                                Draft
                                            </SelectItem>
                                            <SelectItem value="published">
                                                Published
                                            </SelectItem>
                                            <SelectItem value="archived">
                                                Archived
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Error message={errors.status} />
                                </Field>

                                <Field label="Published At">
                                    <Input
                                        type="datetime-local"
                                        value={data.published_at}
                                        onChange={(event) =>
                                            setData(
                                                'published_at',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <Error message={errors.published_at} />
                                </Field>
                            </section>

                            <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
                                <h2 className="text-base font-semibold">
                                    Actions
                                </h2>

                                <div className="flex flex-col gap-3">
                                    <Button type="submit" disabled={processing}>
                                        {processing
                                            ? 'Saving...'
                                            : mode === 'create'
                                              ? 'Create Entry'
                                              : 'Update Entry'}
                                    </Button>
                                    <Link
                                        href={`/my-admin/dashboard/content/${contentType.slug}`}
                                    >
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                        >
                                            Cancel
                                        </Button>
                                    </Link>
                                </div>
                            </section>
                        </aside>
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
