import { Head, Link } from '@inertiajs/react';

import type { DynamicContentEntry, DynamicContentType, Paginated } from '@/types/dynamic-content';

interface Props {
    contentType: DynamicContentType;
    entries: Paginated<DynamicContentEntry>;
    filters: {
        search?: string;
        status?: string;
    };
    statusOptions: string[];
    urls: {
        index: string;
        create: string;
    };
}

export default function Index({
    contentType,
    entries,
    filters,
    statusOptions,
    urls,
}: Props) {
    return (
        <>
            <Head title={contentType.name} />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">{contentType.name}</h1>
                        <p className="text-sm text-slate-500">
                            Manage entries for the <span className="font-medium">{contentType.slug}</span> content type.
                        </p>
                    </div>

                    <Link
                        href={urls.create}
                        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        Create Entry
                    </Link>
                </div>

                <form method="get" action={urls.index} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_200px_auto]">
                    <input
                        type="text"
                        name="search"
                        defaultValue={filters.search ?? ''}
                        placeholder="Search title, slug, excerpt, or field data"
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    />
                    <select
                        name="status"
                        defaultValue={filters.status ?? ''}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    >
                        <option value="">All statuses</option>
                        {statusOptions.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
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
                                <th className="px-4 py-3">Title</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Published</th>
                                <th className="px-4 py-3">Sort</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {entries.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                                        No entries found.
                                    </td>
                                </tr>
                            ) : (
                                entries.data.map((entry) => (
                                    <tr key={entry.id} className="text-sm text-slate-700">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900">{entry.title}</div>
                                            <div className="text-xs text-slate-500">{entry.slug}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                                                {entry.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{entry.published_at ?? '-'}</td>
                                        <td className="px-4 py-3">{entry.sort_order}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-3">
                                                <Link
                                                    href={`${urls.index}/${entry.id}/edit`}
                                                    className="text-sm font-medium text-slate-700 hover:text-slate-900"
                                                >
                                                    Edit
                                                </Link>
                                                <Link
                                                    href={`${urls.index}/${entry.id}`}
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
