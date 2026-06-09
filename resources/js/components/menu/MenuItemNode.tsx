import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, ChevronRight, Trash } from 'lucide-react';
import { useState } from 'react';
import SearchableSelect from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const menuTypes = [
    { value: 'custom', label: 'Custom' },
    { value: 'page', label: 'Page' },
    { value: 'category', label: 'Category' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'dynamic', label: 'Dynamic' },
];

const dynamicSources = [
    { value: 'products', label: 'Products' },
    { value: 'categories', label: 'Categories' },
    { value: 'pages', label: 'Pages' },
    { value: 'posts', label: 'Posts' },
];

const dynamicSorts = [
    { value: 'latest', label: 'Latest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'price_lowest', label: 'Price Lowest' },
    { value: 'price_highest', label: 'Price Highest' },
    { value: 'popular', label: 'Popular' },
];

const dynamicLayouts = [
    { value: 'product_grid', label: 'Product Grid' },
    { value: 'product_list', label: 'Product List' },
    { value: 'mega_menu', label: 'Mega Menu' },
    { value: 'link_list', label: 'Link List' },
];

const dropdownLayouts = [
    { value: 'dropdown', label: 'Standard Dropdown' },
    { value: 'mega_menu', label: 'Mega Menu' },
];

function ensureMetaForType(type: string, currentMeta: Record<string, any> = {}) {
    if (type === 'dropdown') {
        return {
            dropdown_layout: currentMeta.dropdown_layout ?? 'mega_menu',
            columns: currentMeta.columns ?? 4,
        };
    }

    if (type === 'dynamic') {
        return {
            source: currentMeta.source ?? 'products',
            filter: {
                ...(currentMeta.filter ?? {}),
                category_id: currentMeta.filter?.category_id ?? null,
            },
            limit: currentMeta.limit ?? 6,
            sort: currentMeta.sort ?? 'latest',
            layout: currentMeta.layout ?? 'product_grid',
            show_image: currentMeta.show_image ?? true,
            show_price: currentMeta.show_price ?? true,
            show_excerpt: currentMeta.show_excerpt ?? false,
            cta_label: currentMeta.cta_label ?? '',
            cta_url: currentMeta.cta_url ?? '',
        };
    }

    return {};
}

type ProductCategoryOption = {
    id: string;
    name: string;
    slug: string;
};

export default function MenuItemNode({ item, locale, productCategories = [], onChange, onDelete }: {
    item: any;
    locale: string;
    productCategories?: ProductCategoryOption[];
    onChange: (id: string | number, payload: Record<string, any>) => void;
    onDelete: (id: string | number) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const [collapsed, setCollapsed] = useState(true);
    const type = item.type || 'custom';
    const meta = ensureMetaForType(type, item.meta || {});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginLeft: item.depth * 24,
        opacity: isDragging ? 0.5 : 1,
    };

    function updateTranslations(payload: Record<string, any>) {
        onChange(item.id, {
            translations: {
                ...item.translations,
                [locale]: {
                    ...item.translations?.[locale],
                    ...payload,
                },
            },
        });
    }

    function updateMeta(payload: Record<string, any>) {
        onChange(item.id, {
            meta: {
                ...meta,
                ...payload,
            },
        });
    }

    function updateDynamicFilter(categoryId: string | null) {
        onChange(item.id, {
            meta: {
                ...meta,
                filter: {
                    ...(meta.filter || {}),
                    category_id: categoryId,
                },
            },
        });
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="mb-2 rounded-md border bg-card shadow-sm"
        >
            <div className="flex items-center gap-2 p-3">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab text-muted-foreground hover:text-muted-foreground"
                >
                    <GripVertical size={18} />
                </div>

                <button onClick={() => setCollapsed(!collapsed)}>
                    {collapsed ? (
                        <ChevronRight size={16} />
                    ) : (
                        <ChevronDown size={16} />
                    )}
                </button>

                <Input
                    value={item.translations?.[locale]?.title || ''}
                    onChange={(e) => updateTranslations({ title: e.target.value })}
                    className="flex-1"
                />

                <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    {type}
                </span>

                <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(item.id)}
                >
                    <Trash className="h-4 w-4" />
                </Button>
            </div>

            {!collapsed && (
                <div className="space-y-3 border-t bg-muted/50 p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <select
                                value={type}
                                onChange={(e) =>
                                    onChange(item.id, {
                                        type: e.target.value,
                                        meta: ensureMetaForType(e.target.value, item.meta || {}),
                                    })
                                }
                                className="w-full rounded-md border bg-background p-2 text-sm"
                            >
                                {menuTypes.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Target</Label>
                            <select
                                value={item.target || '_self'}
                                onChange={(e) =>
                                    onChange(item.id, {
                                        target: e.target.value,
                                    })
                                }
                                className="w-full rounded-md border bg-background p-2 text-sm"
                            >
                                <option value="_self">Same Tab</option>
                                <option value="_blank">New Tab</option>
                            </select>
                        </div>
                    </div>

                    {type !== 'dynamic' && type !== 'dropdown' && (
                        <div>
                            <Label>URL</Label>
                            <Input
                                value={
                                    item.translations?.[locale]?.url ||
                                    item.url ||
                                    ''
                                }
                                onChange={(e) => updateTranslations({ url: e.target.value })}
                                className="flex-1"
                                placeholder="https://example.com"
                            />
                        </div>
                    )}

                    {type === 'dropdown' && (
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Dropdown Layout</Label>
                                <select
                                    value={meta.dropdown_layout || 'mega_menu'}
                                    onChange={(e) =>
                                        updateMeta({
                                            dropdown_layout: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border bg-background p-2 text-sm"
                                >
                                    {dropdownLayouts.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label>Columns</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={6}
                                    value={meta.columns ?? 4}
                                    onChange={(e) =>
                                        updateMeta({
                                            columns: Number(e.target.value || 1),
                                        })
                                    }
                                />
                            </div>
                        </div>
                    )}

                    {type === 'dynamic' && (
                        <div className="space-y-4 rounded-md border bg-background/80 p-4">
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Source</Label>
                                    <select
                                        value={meta.source || 'products'}
                                        onChange={(e) =>
                                            updateMeta({
                                                source: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-md border bg-background p-2 text-sm"
                                    >
                                        {dynamicSources.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Layout</Label>
                                    <select
                                        value={meta.layout || 'product_grid'}
                                        onChange={(e) =>
                                            updateMeta({
                                                layout: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-md border bg-background p-2 text-sm"
                                    >
                                        {dynamicLayouts.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {meta.source === 'products' && (
                                <div className="space-y-2">
                                    <Label>Product Category</Label>
                                    <SearchableSelect
                                        options={productCategories.map((category: any) => ({
                                            value: category.id,
                                            label: category.name,
                                            description: category.slug,
                                        }))}
                                        value={meta.filter?.category_id ?? ''}
                                        onChange={(value) => updateDynamicFilter(value)}
                                        placeholder="Select category"
                                        clearable
                                    />
                                </div>
                            )}

                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Limit</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={meta.limit ?? 6}
                                        onChange={(e) =>
                                            updateMeta({
                                                limit: Number(e.target.value || 1),
                                            })
                                        }
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label>Sort</Label>
                                    <select
                                        value={meta.sort || 'latest'}
                                        onChange={(e) =>
                                            updateMeta({
                                                sort: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-md border bg-background p-2 text-sm"
                                    >
                                        {dynamicSorts.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`show-image-${item.id}`}
                                        checked={!!meta.show_image}
                                        onCheckedChange={(checked) =>
                                            updateMeta({ show_image: !!checked })
                                        }
                                    />
                                    <Label htmlFor={`show-image-${item.id}`}>Show image</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`show-price-${item.id}`}
                                        checked={!!meta.show_price}
                                        onCheckedChange={(checked) =>
                                            updateMeta({ show_price: !!checked })
                                        }
                                    />
                                    <Label htmlFor={`show-price-${item.id}`}>Show price</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`show-excerpt-${item.id}`}
                                        checked={!!meta.show_excerpt}
                                        onCheckedChange={(checked) =>
                                            updateMeta({ show_excerpt: !!checked })
                                        }
                                    />
                                    <Label htmlFor={`show-excerpt-${item.id}`}>Show excerpt</Label>
                                </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>CTA Label</Label>
                                    <Input
                                        value={meta.cta_label || ''}
                                        onChange={(e) =>
                                            updateMeta({
                                                cta_label: e.target.value,
                                            })
                                        }
                                        placeholder="Lihat Semua Produk"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>CTA URL</Label>
                                    <Input
                                        value={meta.cta_url || ''}
                                        onChange={(e) =>
                                            updateMeta({
                                                cta_url: e.target.value,
                                            })
                                        }
                                        placeholder="/products?category=iphone"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <Label>Icon</Label>
                        <Input
                            value={item.icon || ''}
                            onChange={(e) =>
                                onChange(item.id, {
                                    icon: e.target.value,
                                })
                            }
                            placeholder="Optional icon name"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
