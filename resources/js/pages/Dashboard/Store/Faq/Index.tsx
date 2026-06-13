import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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

interface FaqItem {
    id: string;
    question: string;
    answer: string;
    type: string;
    position: string | null;
    is_active: boolean;
    show_home: boolean;
    sort_order: number;
}

interface OptionItem {
    value: string;
    label: string;
}

interface Props {
    faqs: LaravelPagination<FaqItem>;
    typeOptions: OptionItem[];
    positionOptions: OptionItem[];
    filters: {
        search: string;
        type: string;
        position: string;
        is_active: boolean | null;
        show_home: boolean | null;
    };
}

export default function Index({
    faqs,
    typeOptions,
    positionOptions,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || '');
    const [position, setPosition] = useState(filters.position || '');
    const [isActive, setIsActive] = useState(
        filters.is_active === null ? '' : filters.is_active ? '1' : '0',
    );
    const [showHome, setShowHome] = useState(
        filters.show_home === null ? '' : filters.show_home ? '1' : '0',
    );
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const applyFilter = () => {
        router.get(
            '/my-admin/dashboard/ecommerce/faqs',
            {
                search,
                type: type || undefined,
                position: position || undefined,
                is_active: isActive || undefined,
                show_home: showHome || undefined,
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

        router.delete(`/my-admin/dashboard/ecommerce/faqs/${deletingId}`, {
            onFinish: () => setDeletingId(null),
        });
    };

    const columns = [
        {
            label: 'Question',
            render: (row: FaqItem) => (
                <div className="max-w-xl">
                    <p className="line-clamp-1 font-medium">{row.question}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                        {row.answer}
                    </p>
                </div>
            ),
        },
        {
            label: 'Type',
            render: (row: FaqItem) => (
                <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                    {row.type}
                </span>
            ),
        },
        {
            label: 'Position',
            render: (row: FaqItem) => (
                <span className="text-sm">{row.position || '-'}</span>
            ),
        },
        {
            label: 'Show Home',
            render: (row: FaqItem) => (
                <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.show_home
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300'
                            : 'bg-muted/60 text-foreground'
                    }`}
                >
                    {row.show_home ? 'Yes' : 'No'}
                </span>
            ),
        },
        {
            label: 'Active',
            render: (row: FaqItem) => (
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
            label: 'Sort Order',
            render: (row: FaqItem) => (
                <span className="font-mono text-xs">{row.sort_order}</span>
            ),
        },
        {
            label: 'Actions',
            render: (row: FaqItem) => (
                <div className="flex gap-2">
                    <Link href={`/my-admin/dashboard/ecommerce/faqs/${row.id}/edit`}>
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
            <Head title="FAQ" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">FAQ</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage flexible FAQ by type and position.
                        </p>
                    </div>

                    <Link href="/my-admin/dashboard/ecommerce/faqs/create">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add FAQ
                        </Button>
                    </Link>
                </div>

                <hr className="border-border" />

                <div className="grid gap-3 md:grid-cols-6">
                    <Input
                        className="md:col-span-2"
                        placeholder="Search question or answer..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onKeyDown={(event) =>
                            event.key === 'Enter' && applyFilter()
                        }
                    />
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
                        value={position}
                        onChange={(event) => setPosition(event.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">All Position</option>
                        {positionOptions.map((option) => (
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
                    <select
                        value={showHome}
                        onChange={(event) => setShowHome(event.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">All Home</option>
                        <option value="1">Show Home</option>
                        <option value="0">Hidden</option>
                    </select>
                </div>

                <div>
                    <Button onClick={applyFilter}>Apply Filter</Button>
                </div>

                <DataTable<FaqItem> data={faqs.data} columns={columns} />

                <div className="flex flex-wrap gap-2">
                    {faqs.links.map((link, index) => (
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
                        <AlertDialogTitle>Delete FAQ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will soft-delete the selected FAQ.
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
