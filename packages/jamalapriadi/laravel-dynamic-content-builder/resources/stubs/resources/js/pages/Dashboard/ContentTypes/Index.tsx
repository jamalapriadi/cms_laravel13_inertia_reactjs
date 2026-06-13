import { Head, Link } from '@inertiajs/react';

import type { DynamicContentType, Paginated } from '@/types/dynamic-content';

interface Props {
    contentTypes: Paginated<DynamicContentType>;
    filters: {
        search?: string;
    };
    urls: {
        index: string;
        create: string;
    };
}

export default function Index({ contentTypes, filters, urls }: Props) {
    return (
        <>
            <Head title="Content Types" />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Content Types</h1>
                        <p className="text-sm text-slate-500">
                            Manage reusable content collections like testimonials, FAQs, services, and sliders.
                        </p>
                    </div>

                    <Link
                        href={urls.create}
                        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        Create Content Type
                    </Link>
                </div>

                <form method="get" action={urls.index} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
                    <input
                        type="text"
                        name="search"
                        defaultValue={filters.search ?? ''}
                        placeholder="Search by name, slug, or description"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    />
                    <button
                        type="submit"
                        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Filter
                    </button>
                </form>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr className="text-left text-sm font-medium text-slate-600">
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Slug</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Entries</th>
                                <th className="px-4 py-3">Field Groups</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {contentTypes.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                                        No content types found.
                                    </td>
                                </tr>
                            ) : (
                                contentTypes.data.map((contentType) => (
                                    <tr key={contentType.id} className="text-sm text-slate-700">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900">{contentType.name}</div>
                                            {contentType.description && (
                                                <div className="text-xs text-slate-500">{contentType.description}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">{contentType.slug}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${contentType.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {contentType.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{contentType.entries_count ?? 0}</td>
                                        <td className="px-4 py-3">{contentType.field_groups_count ?? 0}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-3">
                                                <Link
                                                    href={`${urls.index}/${contentType.id}/edit`}
                                                    className="text-sm font-medium text-slate-700 hover:text-slate-900"
                                                >
                                                    Edit
                                                </Link>
                                                <Link
                                                    href={`${urls.index}/${contentType.id}`}
                                                    method="delete"
                                                    as="button"
                                                    className="text-sm font-medium text-red-600 hover:text-red-700"
                                                >
                                                    Delete
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
