import { Head, Link, router } from '@inertiajs/react';
import { FolderTree } from 'lucide-react';
import { useState } from 'react';

import {
    create as createCategory,
    destroy as destroyCategory,
    edit as editCategory,
    index as categoriesIndex,
} from '@/actions/App/Http/Controllers/Store/CategoryController';
import { index as productsIndex } from '@/actions/App/Http/Controllers/Store/ProductController';
import { DataTable } from '@/components/DataTable';
import SearchableSelect from '@/components/SearchableSelect';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/master-data-layout';
import { usePermission } from '@/lib/permissions';
import type { LaravelPagination } from '@/types/LaravelPagination';

interface CategoryChild {
    id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    hierarchy: string;
    children_count: number;
    products_count: number;
    is_publish: boolean;
}

interface Category {
    id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    sort_order: number;
    show_home: boolean;
    is_publish: boolean;
    created_at: string | null;
    hierarchy: string;
    children_count: number;
    products_count: number;
    parent: {
        id: string;
        name: string;
        slug: string;
        hierarchy: string;
    } | null;
    children: CategoryChild[];
}

interface ParentOption {
    id: string;
    name: string;
    slug: string;
    hierarchy: string;
}

interface Props {
    categories: LaravelPagination<Category>;
    parentOptions: ParentOption[];
    filters: {
        search?: string | null;
        type?: string | null;
        parent_id?: string | null;
    };
}

export default function Index({ categories, parentOptions, filters }: Props) {
    const { hasPermission } = usePermission();
    const canCreate = hasPermission('categories.create');
    const canEdit = hasPermission('categories.edit');
    const canDelete = hasPermission('categories.delete');
    const canViewProducts = hasPermission('products.view');

    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType] = useState(filters.type ?? '');
    const [parentId, setParentId] = useState(filters.parent_id ?? '');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(
        null,
    );

    const structureOptions = [
        {
            value: '',
            label: 'All Categories',
            description: 'Show every category',
        },
        {
            value: 'parent',
            label: 'Only Parent Categories',
            description: 'Show top-level categories only',
        },
        {
            value: 'child',
            label: 'Only Child Categories',
            description: 'Show categories that belong under another category',
        },
        {
            value: 'has-children',
            label: 'Has Children',
            description: 'Show categories with sub categories',
        },
        {
            value: 'no-children',
            label: 'No Children',
            description: 'Show categories with no sub categories',
        },
    ];

    const parentCategoryOptions = [
        {
            value: '',
            label: 'All Parent Categories',
            description: 'Show categories from every parent group',
        },
        ...parentOptions.map((option) => ({
            value: option.id,
            label: option.hierarchy,
            description: `Slug: ${option.slug}`,
        })),
    ];

    const visitWithFilters = (
        overrides: Partial<{
            search: string;
            type: string;
            parentId: string;
        }> = {},
    ) => {
        const nextSearch = overrides.search ?? search;
        const nextType = overrides.type ?? type;
        const nextParentId = overrides.parentId ?? parentId;

        setSearch(nextSearch);
        setType(nextType);
        setParentId(nextParentId);

        router.get(
            categoriesIndex().url,
            {
                search: nextSearch || undefined,
                type: nextType || undefined,
                parent_id: nextParentId || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const resetFilters = () => {
        visitWithFilters({
            search: '',
            type: '',
            parentId: '',
        });
    };

    const handleDelete = () => {
        if (!deletingId) {
            return;
        }

        router.delete(destroyCategory(deletingId).url, {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    };

    const deleteDisabledReason = (category: Category) => {
        if (category.children_count > 0) {
            return 'Remove or move the child categories first.';
        }

        if (category.products_count > 0) {
            return 'Move or delete the products in this category first.';
        }

        return null;
    };

    const columns = [
        {
            label: 'Category',
            render: (row: Category) => (
                <div className="space-y-1">
                    <p className="font-medium text-foreground">{row.name}</p>
                    <p className="text-xs text-muted-foreground">/{row.slug}</p>
                    {row.hierarchy !== row.name ? (
                        <p className="text-xs text-muted-foreground">
                            {row.hierarchy}
                        </p>
                    ) : null}
                </div>
            ),
        },
        {
            label: 'Structure',
            render: (row: Category) => (
                <div className="space-y-2 text-sm">
                    <div>
                        <span className="text-muted-foreground">Parent: </span>
                        {row.parent ? (
                            <button
                                type="button"
                                onClick={() =>
                                    visitWithFilters({
                                        parentId: row.parent?.id ?? '',
                                    })
                                }
                                className="font-medium text-primary hover:underline"
                            >
                                {row.parent.name}
                            </button>
                        ) : (
                            <span className="text-muted-foreground">
                                Top level category
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">
                            {row.children_count} sub categories
                        </span>
                        {row.children_count > 0 ? (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedCategory(row)}
                            >
                                View List
                            </Button>
                        ) : null}
                    </div>
                </div>
            ),
        },
        {
            label: 'Products',
            render: (row: Category) => (
                <div className="space-y-1">
                    <p className="font-medium">{row.products_count}</p>
                    {row.products_count > 0 && canViewProducts ? (
                        <Link
                            href={productsIndex.url({
                                query: { category_id: row.id },
                            })}
                            className="text-xs text-primary hover:underline"
                        >
                            View Products
                        </Link>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            {row.products_count > 0
                                ? 'Products available'
                                : 'No products yet'}
                        </p>
                    )}
                </div>
            ),
        },
        {
            label: 'Status',
            render: (row: Category) => (
                <Badge variant={row.is_publish ? 'default' : 'secondary'}>
                    {row.is_publish ? 'Published' : 'Draft'}
                </Badge>
            ),
        },
        {
            label: 'Action',
            render: (row: Category) => {
                const cannotDeleteReason = deleteDisabledReason(row);

                return (
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {canEdit ? (
                                <Button asChild size="sm" variant="secondary">
                                    <Link href={editCategory(row).url}>
                                        Edit
                                    </Link>
                                </Button>
                            ) : null}

                            {canDelete ? (
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={Boolean(cannotDeleteReason)}
                                    title={cannotDeleteReason ?? undefined}
                                    onClick={() => setDeletingId(row.id)}
                                >
                                    Delete
                                </Button>
                            ) : null}
                        </div>

                        {cannotDeleteReason ? (
                            <p className="max-w-48 text-xs text-muted-foreground">
                                {cannotDeleteReason}
                            </p>
                        ) : null}
                    </div>
                );
            },
        },
    ];

    return (
        <AppLayout>
            <Head title="Product Categories" />

            <div className="container mx-auto space-y-6 px-6 py-10">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold">
                            Product Categories
                        </h1>
                        <p className="text-muted-foreground">
                            Use the filters below to find parent and child
                            categories more quickly.
                        </p>
                    </div>

                    {canCreate ? (
                        <Button asChild>
                            <Link href={createCategory().url}>
                                Create Category
                            </Link>
                        </Button>
                    ) : null}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>
                            Search by category name or slug, then narrow the
                            list by structure or parent category.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.9fr)_minmax(240px,1fr)]">
                            <Input
                                placeholder="Search category name or slug..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                onKeyDown={(event) =>
                                    event.key === 'Enter' && visitWithFilters()
                                }
                            />

                            <SearchableSelect
                                options={structureOptions}
                                value={type}
                                onChange={(value) => setType(value ?? '')}
                                placeholder="All Categories"
                            />

                            <SearchableSelect
                                options={parentCategoryOptions}
                                value={parentId}
                                onChange={(value) => setParentId(value ?? '')}
                                placeholder="All Parent Categories"
                            />
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button onClick={() => visitWithFilters()}>
                                Apply Filter
                            </Button>
                            <Button variant="outline" onClick={resetFilters}>
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {categories.data.length === 0 ? (
                    <Card>
                        <CardContent className="space-y-4 py-10 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <FolderTree className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-semibold">
                                    No categories found
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Try changing the filters, or create a new
                                    category if the data does not exist yet.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Category List</CardTitle>
                            <CardDescription>
                                Showing {categories.from ?? 0}-
                                {categories.to ?? 0} of{' '}
                                {categories.total.toLocaleString('id-ID')}{' '}
                                categories.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <DataTable<Category>
                                data={categories.data}
                                columns={columns}
                            />

                            <div className="flex flex-wrap gap-2">
                                {categories.links.map((link, index) => (
                                    <button
                                        key={index}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url && router.visit(link.url)
                                        }
                                        className={`rounded px-3 py-1 text-sm ${
                                            link.active
                                                ? 'bg-primary text-primary-foreground'
                                                : 'hover:bg-muted'
                                        } ${!link.url ? 'opacity-50' : ''}`}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Dialog
                open={!!selectedCategory}
                onOpenChange={(open) => !open && setSelectedCategory(null)}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedCategory
                                ? `Sub Categories of ${selectedCategory.name}`
                                : 'Sub Categories'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedCategory
                                ? 'These are the direct child categories under the selected parent category.'
                                : 'List of child categories.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
                        {selectedCategory?.children.length ? (
                            selectedCategory.children.map((child) => (
                                <div
                                    key={child.id}
                                    className="rounded-lg border border-border p-4"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="space-y-1">
                                            <p className="font-medium">
                                                {child.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                /{child.slug}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {child.products_count} products
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge
                                                variant={
                                                    child.is_publish
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {child.is_publish
                                                    ? 'Published'
                                                    : 'Draft'}
                                            </Badge>

                                            {canEdit ? (
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="secondary"
                                                >
                                                    <Link
                                                        href={
                                                            editCategory(child)
                                                                .url
                                                        }
                                                    >
                                                        Edit
                                                    </Link>
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                This category does not have sub categories yet.
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        {selectedCategory ? (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedCategory(null);
                                    visitWithFilters({
                                        parentId: selectedCategory.id,
                                    });
                                }}
                            >
                                Filter by This Parent
                            </Button>
                        ) : null}
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedCategory(null)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={!!deletingId}
                onOpenChange={() => setDeletingId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Empty categories can be deleted. Categories with sub
                            categories or products must be cleaned up first.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
