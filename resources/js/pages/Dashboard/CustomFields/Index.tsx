import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
    create,
    destroy,
    edit,
    index,
} from '@/actions/App/Http/Controllers/Dashboard/CustomFieldGroupController';
import { DataTable } from '@/components/DataTable';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePermission } from '@/lib/permissions';
import type { CustomFieldGroupSummary } from '@/types/dynamic-content';
import type { LaravelPagination } from '@/types/LaravelPagination';

interface Props {
    customFieldGroups: LaravelPagination<CustomFieldGroupSummary>;
    filters: {
        search?: string;
    };
}

export default function Index({ customFieldGroups, filters }: Props) {
    const { hasPermission } = usePermission();
    const canCreate = hasPermission('custom-fields.create');
    const canEdit = hasPermission('custom-fields.edit');
    const canDelete = hasPermission('custom-fields.delete');
    const [search, setSearch] = useState(filters.search || '');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const applyFilter = () => {
        router.visit(
            index({
                query: {
                    search: search || undefined,
                },
            }).url,
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDelete = () => {
        if (!deletingId) {
            return;
        }

        router.delete(destroy({ customFieldGroup: deletingId }).url, {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    };

    const columns = [
        {
            label: 'Group',
            render: (row: CustomFieldGroupSummary) => (
                <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">/{row.slug}</p>
                </div>
            ),
        },
        {
            label: 'Content Type',
            render: (row: CustomFieldGroupSummary) => (
                <div>
                    <p className="text-sm">{row.content_type?.name ?? '-'}</p>
                    <p className="text-xs text-muted-foreground">
                        {row.content_type?.slug ?? '-'}
                    </p>
                </div>
            ),
        },
        {
            label: 'Fields',
            render: (row: CustomFieldGroupSummary) => row.fields_count,
        },
        {
            label: 'Status',
            render: (row: CustomFieldGroupSummary) => (
                <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                    }`}
                >
                    {row.is_active ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            label: 'Sort',
            render: (row: CustomFieldGroupSummary) => (
                <span className="font-mono text-xs">{row.sort_order}</span>
            ),
        },
        {
            label: 'Actions',
            render: (row: CustomFieldGroupSummary) => (
                <div className="flex gap-2">
                    {canEdit && (
                        <Link href={edit({ customFieldGroup: row.id }).url}>
                            <Button size="sm" variant="secondary">
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    )}
                    {canDelete && (
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeletingId(row.id)}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Custom Fields" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Custom Fields
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage field groups and their reusable schemas for
                            each dynamic content type.
                        </p>
                    </div>

                    {canCreate && (
                        <Link href={create().url}>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Field Group
                            </Button>
                        </Link>
                    )}
                </div>

                <hr className="border-border" />

                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <Input
                        placeholder="Search group, slug, description, or content type..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onKeyDown={(event) =>
                            event.key === 'Enter' && applyFilter()
                        }
                    />
                    <Button onClick={applyFilter}>Apply Filter</Button>
                </div>

                <DataTable<CustomFieldGroupSummary>
                    data={customFieldGroups.data}
                    columns={columns}
                />

                <div className="flex flex-wrap gap-2">
                    {customFieldGroups.links.map((link, indexLink) => (
                        <button
                            key={`${link.label}-${indexLink}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            disabled={!link.url}
                            onClick={() => link.url && router.visit(link.url)}
                            className={`rounded px-3 py-1 text-sm ${
                                link.active
                                    ? 'bg-primary font-semibold text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted'
                            } ${!link.url && 'pointer-events-none opacity-50'}`}
                        />
                    ))}
                </div>
            </div>

            <AlertDialog
                open={!!deletingId}
                onOpenChange={() => setDeletingId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete field group?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will soft-delete the field group and its
                            custom fields.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
