import {
    DndContext,
    closestCenter,
    useSensor,
    useSensors,
    PointerSensor,
} from '@dnd-kit/core';
import type {
    DragEndEvent,
    DragMoveEvent,
    DragOverEvent,
    DragStartEvent,
} from '@dnd-kit/core';

import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { useMemo, useState } from 'react';
import { buildTree, flattenTree, getProjection } from '@/utils/tree';
import type { TreeMenuItem } from '@/utils/tree';
import MenuItemNode from './MenuItemNode';

export default function MenuTree({
    data = [],
    setData,
    locale,
    productCategories = [],
}: {
    data?: TreeMenuItem[];
    setData: (
        updater:
            | TreeMenuItem[]
            | ((previous: TreeMenuItem[]) => TreeMenuItem[]),
    ) => void;
    locale: string;
    productCategories?: Array<{ id: string; name: string; slug: string }>;
}) {
    const [, setActiveId] = useState<string | number | null>(null);
    const [offsetX, setOffsetX] = useState(0);
    const [overId, setOverId] = useState<string | number | null>(null);

    const sensors = useSensors(useSensor(PointerSensor));

    const flat = useMemo(() => {
        const normalizedLocale = locale?.replace('_', '-');

        return flattenTree(data || []).map((item) => ({
            ...item,
            activeTranslation:
                item.translations?.[normalizedLocale] ||
                item.translations?.[locale] ||
                {},
        }));
    }, [data, locale]);

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id);
    }

    function handleDragMove(event: DragMoveEvent) {
        setOffsetX(event.delta.x);
    }

    function handleDragOver(event: DragOverEvent) {
        setOverId(event.over?.id || null);
    }

    function updateItem(
        tree: TreeMenuItem[],
        id: string | number,
        payload: Record<string, any>,
    ): TreeMenuItem[] {
        return tree.map((item) => {
            if (String(item.id) === String(id)) {
                return {
                    ...item,
                    ...payload,
                    translations: {
                        ...item.translations,
                        ...payload.translations,
                    },
                };
            }

            if (item.children?.length) {
                return {
                    ...item,
                    children: updateItem(item.children, id, payload),
                };
            }

            return item;
        });
    }

    function deleteItem(
        tree: TreeMenuItem[],
        id: string | number,
    ): TreeMenuItem[] {
        return tree
            .filter((item) => String(item.id) !== String(id))
            .map((item) => ({
                ...item,
                children: item.children ? deleteItem(item.children, id) : [],
            }));
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!over) {
            return;
        }

        const projection = getProjection(flat, active.id, over.id, offsetX);

        if (!projection) {
            return;
        }

        const { depth, parentId, newItems } = projection;

        const movedItems = newItems.map((item) => {
            if (String(item.id) === String(active.id)) {
                return { ...item, depth, parentId };
            }

            return item;
        });

        const normalized = movedItems.map((item, index, arr) => {
            const itemDepth = item.depth ?? 0;

            if (itemDepth === 0) {
                return { ...item, parentId: null };
            }

            for (let i = index - 1; i >= 0; i--) {
                if ((arr[i].depth ?? 0) === itemDepth - 1) {
                    return { ...item, parentId: arr[i].id };
                }
            }

            return item;
        });

        setData(buildTree(normalized));

        setActiveId(null);
        setOverId(null);
        setOffsetX(0);
    }

    return (
        <div className="rounded-lg border p-4">
            <h2 className="mb-4 font-semibold">Menu Structure</h2>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={flat.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {flat.length ? (
                        flat.map((item) => {
                            const normalizedLocale = locale?.replace('_', '-');

                            const hasTranslation =
                                item.translations?.[normalizedLocale]?.title ||
                                item.translations?.[locale]?.title;

                            return (
                                <div key={item.id} className="relative">
                                    {overId === item.id && (
                                        <div className="absolute -top-1 right-0 left-0 h-1 rounded bg-blue-500" />
                                    )}

                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <MenuItemNode
                                                item={item}
                                                locale={locale}
                                                productCategories={
                                                    productCategories
                                                }
                                                onChange={(id, payload) => {
                                                    setData((prev) =>
                                                        updateItem(
                                                            prev,
                                                            id,
                                                            payload,
                                                        ),
                                                    );
                                                }}
                                                onDelete={(id) => {
                                                    setData((prev) =>
                                                        deleteItem(prev, id),
                                                    );
                                                }}
                                            />
                                        </div>

                                        {!hasTranslation && (
                                            <span className="text-xs whitespace-nowrap text-red-500">
                                                No translation
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                            No menu items yet
                        </div>
                    )}
                </SortableContext>
            </DndContext>
        </div>
    );
}
