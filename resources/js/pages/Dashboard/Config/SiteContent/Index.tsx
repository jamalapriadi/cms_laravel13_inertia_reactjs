import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

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
import type { LaravelPagination } from '@/types/LaravelPagination';

interface ActiveLanguage {
    code: string;
    name: string;
    default_locale: string | null;
}

interface TranslationItem {
    id: string;
    locale: string;
    value: string | null;
}

interface SiteContentItem {
    id: string;
    key: string;
    group: string | null;
    type: string;
    is_active: boolean;
    sort_order: number;
    translations: TranslationItem[];
}

interface OptionItem {
    value: string;
    label: string;
}

interface Props {
    siteContents: LaravelPagination<SiteContentItem>;
    activeLanguages: ActiveLanguage[];
    groupOptions: OptionItem[];
    typeOptions: OptionItem[];
    filters: {
        search: string;
        group: string;
        type: string;
        is_active: boolean | null;
    };
}

export default function Index({
    siteContents,
    activeLanguages,
    groupOptions,
    typeOptions,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [group, setGroup] = useState(filters.group || '');
    const [type, setType] = useState(filters.type || '');
    const [isActive, setIsActive] = useState(
        filters.is_active === null ? '' : filters.is_active ? '1' : '0',
    );
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const applyFilter = () => {
        router.get(
            '/my-admin/dashboard/config/site-contents',
            {
                search,
                group: group || undefined,
                type: type || undefined,
                is_active: isActive || undefined,
            },
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

        router.delete(`/my-admin/dashboard/config/site-contents/${deletingId}`, {
            onFinish: () => setDeletingId(null),
        });
    };

    const columns = [
        {
            label: 'Key',
            render: (row: SiteContentItem) => (
                <div>
                    <p className="font-medium">{row.key}</p>
                </div>
            ),
        },
        {
            label: 'Group',
            render: (row: SiteContentItem) => (
                <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {row.group || 'general'}
                </span>
            ),
        },
        {
            label: 'Type',
            render: (row: SiteContentItem) => (
                <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                    {row.type}
                </span>
            ),
        },
        {
            label: 'Active',
            render: (row: SiteContentItem) => (
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
            render: (row: SiteContentItem) => (
                <span className="font-mono text-xs">{row.sort_order}</span>
            ),
        },
        {
            label: 'Translations',
            render: (row: SiteContentItem) => (
                <div className="flex flex-wrap gap-1">
                    {activeLanguages.map((language) => {
                        const translation = normalizeTranslations(row.translations).find(
                            (item) => item.locale === language.code,
                        );
                        const filled = !!translation?.value?.trim();

                        return (
                            <span
                                key={`${row.id}-${language.code}`}
                                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                    filled
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                                }`}
                            >
                                {language.code.toUpperCase()}: {filled ? 'filled' : 'empty'}
                            </span>
                        );
                    })}
                </div>
            ),
        },
        {
            label: 'Actions',
            render: (row: SiteContentItem) => (
                <div className="flex gap-2">
                    <Link href={`/my-admin/dashboard/config/site-contents/${row.id}/edit`}>
                        <Button size="sm" variant="secondary">
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletingId(row.id)}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Site Contents" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Site Contents</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage dynamic website texts by key, group, type, and locale.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/my-admin/dashboard/config/site-contents/usage" target="_blank">
                            <Button variant="outline" className="gap-2">
                                <BookOpen className="h-4 w-4" />
                                Cara Penggunaan
                            </Button>
                        </Link>
                        <Link href="/my-admin/dashboard/config/site-contents/create">
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Content
                            </Button>
                        </Link>
                    </div>
                </div>

                <hr className="border-border" />

                <div className="grid gap-3 md:grid-cols-5">
                    <Input
                        className="md:col-span-2"
                        placeholder="Search key, group, type, or translation..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onKeyDown={(event) =>
                            event.key === 'Enter' && applyFilter()
                        }
                    />
                    <select
                        value={group}
                        onChange={(event) => setGroup(event.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">All Group</option>
                        {groupOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <select
                        value={type}
                        onChange={(event) => setType(event.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">All Type</option>
                        {typeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <select
                        value={isActive}
                        onChange={(event) => setIsActive(event.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">All Status</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>

                <div>
                    <Button onClick={applyFilter}>Apply Filter</Button>
                </div>

                <DataTable<SiteContentItem> data={siteContents.data} columns={columns} />

                <div className="flex flex-wrap gap-2">
                    {siteContents.links.map((link, index) => (
                        <button
                            key={`${link.label}-${index}`}
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
                        <AlertDialogTitle>Delete site content?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will soft-delete the selected content key.
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

function normalizeTranslations(
    translations: SiteContentItem['translations'] | { data?: TranslationItem[] } | null | undefined,
): TranslationItem[] {
    if (Array.isArray(translations)) {
        return translations;
    }

    if (translations && Array.isArray(translations.data)) {
        return translations.data;
    }

    return [];
}
