import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
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

interface ProductCollection {
    id: string;
    name: string;
    slug: string;
    type: string | null;
    title: string | null;
    description: string | null;
    banner_image: string | null;
    banner_image_url: string | null;
    is_active: boolean;
    show_home: boolean;
    start_at: string | null;
    end_at: string | null;
    sort_order: number;
    items_count: number;
}

interface TypeOption {
    value: string;
    label: string;
}

interface Props {
    collections: LaravelPagination<ProductCollection>;
    typeOptions: TypeOption[];
    filters: {
        search: string;
        type: string | null;
        is_active: boolean | null;
        show_home: boolean | null;
    };
}

export default function Index({ collections, typeOptions, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType] = useState(filters.type ?? '');
    const [isActive, setIsActive] = useState(
        filters.is_active === null ? '' : filters.is_active ? '1' : '0',
    );
    const [showHome, setShowHome] = useState(
        filters.show_home === null ? '' : filters.show_home ? '1' : '0',
    );
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const applyFilter = () => {
        router.get(
            '/my-admin/dashboard/ecommerce/product-collections',
            {
                search,
                type: type || undefined,
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

        router.delete(`/my-admin/dashboard/ecommerce/product-collections/${deletingId}`, {
            onFinish: () => setDeletingId(null),
        });
    };

    const columns = [
        {
            label: 'Name',
            render: (row: ProductCollection) => (
                <div>
                    <p className="font-medium text-foreground">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.slug}</p>
                </div>
            ),
        },
        {
            label: 'Type',
            render: (row: ProductCollection) => (
                <span className="text-sm">{row.type || '-'}</span>
            ),
        },
        {
            label: 'Show Home',
            render: (row: ProductCollection) => (
                <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.show_home
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'bg-muted/50 text-foreground'
                    }`}
                >
                    {row.show_home ? 'Yes' : 'No'}
                </span>
            ),
        },
        {
            label: 'Active',
            render: (row: ProductCollection) => (
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
            label: 'Period',
            render: (row: ProductCollection) => (
                <span className="text-xs text-muted-foreground">
                    {formatPeriod(row.start_at, row.end_at)}
                </span>
            ),
        },
        {
            label: 'Items Count',
            render: (row: ProductCollection) => (
                <span className="font-medium">{row.items_count}</span>
            ),
        },
        {
            label: 'Sort Order',
            render: (row: ProductCollection) => (
                <span className="font-mono text-xs">{row.sort_order}</span>
            ),
        },
        {
            label: 'Actions',
            render: (row: ProductCollection) => (
                <div className="flex gap-2">
                    <Link href={`/my-admin/dashboard/ecommerce/product-collections/${row.id}`}>
                        <Button size="sm" variant="secondary" title="View">
                            <Eye className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                    <Link
                        href={`/my-admin/dashboard/ecommerce/product-collections/${row.id}/edit`}
                    >
                        <Button size="sm" variant="secondary" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                    <Button
                        size="sm"
                        variant="destructive"
                        title="Delete"
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
            <Head title="Product Collections" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Product Collections
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage homepage and promo product sections.
                        </p>
                    </div>

                    <Link href="/my-admin/dashboard/ecommerce/product-collections/create">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Collection
                        </Button>
                    </Link>
                </div>

                <hr className="border-border" />

                <div className="grid gap-3 md:grid-cols-5">
                    <Input
                        className="md:col-span-2"
                        placeholder="Search name, slug, type..."
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

                <DataTable<ProductCollection>
                    data={collections.data}
                    columns={columns}
                />

                <div className="flex flex-wrap gap-2">
                    {collections.links.map((link, index) => (
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
                        <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will soft-delete the selected product
                            collection.
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

function formatPeriod(startAt: string | null, endAt: string | null): string {
    if (!startAt && !endAt) {
        return 'Always';
    }

    const startText = startAt
        ? new Date(startAt).toLocaleString('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
          })
        : 'No start';

    const endText = endAt
        ? new Date(endAt).toLocaleString('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
          })
        : 'No end';

    return `${startText} - ${endText}`;
}
