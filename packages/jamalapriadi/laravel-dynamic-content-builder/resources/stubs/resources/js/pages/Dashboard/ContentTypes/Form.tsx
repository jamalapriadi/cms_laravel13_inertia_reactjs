import { Head, Link, useForm } from '@inertiajs/react';
import type React from 'react';

import type { DynamicContentType } from '@/types/dynamic-content';

interface Props {
    mode: 'create' | 'edit';
    contentType?: DynamicContentType;
    urls: Record<string, string>;
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

export default function Form({ mode, contentType, urls }: Props) {
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

        if (mode === 'create') {
            post(urls.store);

            return;
        }

        put(urls.update);
    };

    return (
        <>
            <Head title={mode === 'create' ? 'Create Content Type' : 'Edit Content Type'} />

            <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        {mode === 'create' ? 'Create Content Type' : 'Edit Content Type'}
                    </h1>
                    <p className="text-sm text-slate-500">
                        Define reusable dynamic content collections for your storefront or app sections.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Name" required>
                            <input
                                type="text"
                                className={inputClass}
                                value={data.name}
                                onChange={(event) => {
                                    const nextName = event.target.value;
                                    setData('name', nextName);

                                    if (!data.slug || data.slug === slugify(data.name)) {
                                        setData('slug', slugify(nextName));
                                    }
                                }}
                            />
                            <Error message={errors.name} />
                        </Field>

                        <Field label="Slug" required>
                            <input
                                type="text"
                                className={inputClass}
                                value={data.slug}
                                onChange={(event) => setData('slug', slugify(event.target.value))}
                            />
                            <Error message={errors.slug} />
                        </Field>

                        <Field label="Icon">
                            <input
                                type="text"
                                className={inputClass}
                                value={data.icon}
                                onChange={(event) => setData('icon', event.target.value)}
                            />
                            <Error message={errors.icon} />
                        </Field>

                        <Field label="Sort Order">
                            <input
                                type="number"
                                min={0}
                                className={inputClass}
                                value={data.sort_order}
                                onChange={(event) => setData('sort_order', Number(event.target.value || 0))}
                            />
                            <Error message={errors.sort_order} />
                        </Field>

                        <Field label="Description" className="md:col-span-2">
                            <textarea
                                rows={4}
                                className={inputClass}
                                value={data.description}
                                onChange={(event) => setData('description', event.target.value)}
                            />
                            <Error message={errors.description} />
                        </Field>
                    </div>

                    <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(event) => setData('is_active', event.target.checked)}
                        />
                        <span>Active content types can be used immediately for content entry management.</span>
                    </label>

                    <div className="flex flex-wrap justify-end gap-3">
                        <Link
                            href={urls.index}
                            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                        >
                            {processing ? 'Saving...' : mode === 'create' ? 'Create Content Type' : 'Update Content Type'}
                        </button>
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
            <label className="block text-sm font-medium text-slate-900">
                {label}
                {required ? ' *' : ''}
            </label>
            {children}
        </div>
    );
}

function Error({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-sm text-red-600">{message}</p>;
}

const inputClass =
    'w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200';
