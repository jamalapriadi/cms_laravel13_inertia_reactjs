import { Head, Link, useForm } from '@inertiajs/react';
import type React from 'react';

import type { CustomFieldGroupSummary, DynamicContentType } from '@/types/dynamic-content';

interface Props {
    mode: 'create' | 'edit';
    contentTypes: DynamicContentType[];
    urls: Record<string, string>;
    customFieldGroup?: CustomFieldGroupSummary;
}

interface FormData {
    name: string;
    slug: string;
    description: string;
    content_type_id: string;
    is_active: boolean;
    sort_order: number;
}

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export default function GroupForm({
    mode,
    contentTypes,
    customFieldGroup,
    urls,
}: Props) {
    const { data, setData, post, put, processing, errors } = useForm<FormData>({
        name: customFieldGroup?.name ?? '',
        slug: customFieldGroup?.slug ?? '',
        description: customFieldGroup?.description ?? '',
        content_type_id: customFieldGroup?.content_type?.id ?? contentTypes[0]?.id ?? '',
        is_active: customFieldGroup?.is_active ?? true,
        sort_order: customFieldGroup?.sort_order ?? 0,
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
            <Head title={mode === 'create' ? 'Create Field Group' : 'Edit Field Group'} />

            <form onSubmit={submit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Group Name" required>
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

                    <Field label="Content Type" required>
                        <select
                            className={inputClass}
                            value={data.content_type_id}
                            onChange={(event) => setData('content_type_id', event.target.value)}
                        >
                            {contentTypes.map((contentType) => (
                                <option key={contentType.id} value={contentType.id}>
                                    {contentType.name}
                                </option>
                            ))}
                        </select>
                        <Error message={errors.content_type_id} />
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
                    <span>Active field groups are loaded into dashboard forms and public API responses.</span>
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
                        {processing ? 'Saving...' : mode === 'create' ? 'Create Field Group' : 'Update Field Group'}
                    </button>
                </div>
            </form>
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
