import { Head, Link, useForm } from '@inertiajs/react';
import type React from 'react';

import DynamicFieldInput from '@/components/dynamic-content/DynamicFieldInput';
import type {
    DynamicContentFormData,
    DynamicContentType,
    DynamicFieldGroup,
} from '@/types/dynamic-content';

interface Props {
    mode: 'create' | 'edit';
    contentType: DynamicContentType;
    fieldGroups: DynamicFieldGroup[];
    form: DynamicContentFormData;
    statusOptions: string[];
    urls: Record<string, string>;
    mediaLibrary: {
        index: string;
        store: string;
    };
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
    statusOptions,
    urls,
    mediaLibrary,
}: Props) {
    const { data, setData, post, put, processing, errors } = useForm<DynamicContentFormData>({
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

        if (mode === 'create') {
            post(urls.store);

            return;
        }

        put(urls.update);
    };

    return (
        <>
            <Head title={mode === 'create' ? `Create ${contentType.name}` : `Edit ${contentType.name}`} />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            {mode === 'create' ? `Create ${contentType.name}` : `Edit ${contentType.name}`}
                        </h1>
                        <p className="text-sm text-slate-500">
                            Fill the entry details and complete the dynamic fields configured for this content type.
                        </p>
                    </div>

                    <Link
                        href={urls.index}
                        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Back to List
                    </Link>
                </div>

                <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
                    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Title" required className="md:col-span-2">
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={data.title}
                                    onChange={(event) => {
                                        const nextTitle = event.target.value;
                                        setData('title', nextTitle);

                                        if (!data.slug) {
                                            setData('slug', slugify(nextTitle));
                                        }
                                    }}
                                />
                                <Error message={errors.title} />
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

                            <Field label="Excerpt" className="md:col-span-2">
                                <textarea
                                    rows={4}
                                    className={inputClass}
                                    value={data.excerpt}
                                    onChange={(event) => setData('excerpt', event.target.value)}
                                />
                                <Error message={errors.excerpt} />
                            </Field>
                        </div>

                        {fieldGroups.map((group) => (
                            <section key={group.id} className="space-y-4">
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900">
                                        {group.name}
                                    </h2>
                                    {group.description && (
                                        <p className="text-sm text-slate-500">{group.description}</p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {group.fields.map((field) => (
                                        <DynamicFieldInput
                                            key={field.id}
                                            field={field}
                                            value={data.fields[field.name]}
                                            mediaLibrary={mediaLibrary}
                                            error={errors[`fields.${field.name}` as keyof typeof errors] as string | undefined}
                                            onChange={(value) =>
                                                setData('fields', {
                                                    ...data.fields,
                                                    [field.name]: value,
                                                })
                                            }
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </section>

                    <aside className="space-y-6">
                        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-base font-semibold text-slate-900">Publishing</h2>

                            <Field label="Status" required>
                                <select
                                    className={inputClass}
                                    value={data.status}
                                    onChange={(event) => setData('status', event.target.value)}
                                >
                                    {statusOptions.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                                <Error message={errors.status} />
                            </Field>

                            <Field label="Published At">
                                <input
                                    type="datetime-local"
                                    className={inputClass}
                                    value={data.published_at}
                                    onChange={(event) => setData('published_at', event.target.value)}
                                />
                                <Error message={errors.published_at} />
                            </Field>
                        </section>

                        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                            >
                                {processing ? 'Saving...' : mode === 'create' ? 'Create Entry' : 'Update Entry'}
                            </button>

                            <Link
                                href={urls.index}
                                className="block rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </Link>
                        </section>
                    </aside>
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
