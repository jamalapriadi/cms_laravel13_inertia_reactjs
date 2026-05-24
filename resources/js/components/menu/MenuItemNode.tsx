import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GripVertical, ChevronDown, ChevronRight, Trash } from 'lucide-react';
import { useState } from 'react';

export default function MenuItemNode({ item, locale, onChange, onDelete }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const [collapsed, setCollapsed] = useState(true);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginLeft: item.depth * 24,
        opacity: isDragging ? 0.5 : 1,
    };

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
                    onChange={(e) =>
                        onChange(item.id, {
                            translations: {
                                ...item.translations,
                                [locale]: {
                                    ...item.translations?.[locale],
                                    title: e.target.value,
                                },
                            },
                        })
                    }
                    className="flex-1"
                />

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
                    <div>
                        <label className="text-sm font-medium">URL</label>
                        <Input
                            value={
                                item.translations?.[locale]?.url ||
                                item.url ||
                                ''
                            }
                            onChange={(e) =>
                                onChange(item.id, {
                                    translations: {
                                        ...item.translations,
                                        [locale]: {
                                            ...item.translations?.[locale],
                                            url: e.target.value,
                                        },
                                    },
                                })
                            }
                            className="flex-1"
                            placeholder="https://example.com"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Target</label>
                        <select
                            value={item.target || '_self'}
                            onChange={(e) =>
                                onChange(item.id, {
                                    target: e.target.value,
                                })
                            }
                            className="w-full rounded-md border p-2"
                        >
                            <option value="_self">Same Tab</option>
                            <option value="_blank">New Tab</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}
