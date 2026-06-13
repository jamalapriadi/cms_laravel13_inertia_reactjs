import { Head, Link } from '@inertiajs/react';

import type { CustomFieldGroupSummary, Paginated } from '@/types/dynamic-content';

interface Props {
    customFieldGroups: Paginated<CustomFieldGroupSummary>;
    filters: {
        search?: string;
    };
    urls: {
        index: string;
        create: string;
    };
}

export default function Index({ customFieldGroups, filters, urls }: Props) {
    return (
        <>
            <Head title="Custom Fields" />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Field Groups</h1>
                        <p className="text-sm text-slate-500">
                            Build reusable field groups and attach them to a content type.
                        </p>
                    </div>

                    <Link
                        href={urls.create}
                        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        Create Field Group
                    </Link>
                </div>

                <form method="get" action={urls.index} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
                    <input
                        type="text"
                        name="search"
                        defaultValue={filters.search ?? ''}
                        placeholder="Search field groups"
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
                                <th className="px-4 py-3">Group</th>
                                <th className="px-4 py-3">Content Type</th>
                                <th className="px-4 py-3">Fields</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {customFieldGroups.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                                        No field groups found.
                                    </td>
                                </tr>
                            ) : (
                                customFieldGroups.data.map((group) => (
                                    <tr key={group.id} className="text-sm text-slate-700">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900">{group.name}</div>
                                            <div className="text-xs text-slate-500">{group.slug}</div>
                                        </td>
                                        <td className="px-4 py-3">{group.content_type?.name ?? '-'}</td>
                                        <td className="px-4 py-3">{group.fields_count}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${group.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {group.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-3">
                                                <Link
                                                    href={`${urls.index}/${group.id}/edit`}
                                                    className="text-sm font-medium text-slate-700 hover:text-slate-900"
                                                >
                                                    Edit
                                                </Link>
                                                <Link
                                                    href={`${urls.index}/${group.id}`}
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
