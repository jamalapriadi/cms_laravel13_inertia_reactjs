import { useDroppable } from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';

import type { BlockInstance } from '@/types/block';

type DropPosition = 'before' | 'after' | 'inside';
const NESTABLE_BLOCKS = [
    'section',
    'container',
    'column',
    'grid',
    'grid-item',
    'columns',
    'flex-row',
    'flex-column',
    'card',
    'tabs',
    'accordion',
    'slider',
];

interface DropIndicator {
    id: number | string;
    position: DropPosition;
}

interface StructureTreeProps {
    items: BlockInstance[];
    selectedBlock: BlockInstance | null;
    setSelectedBlock: (block: BlockInstance) => void;
    dropIndicator?: DropIndicator | null;
    onDelete: (id: number) => void;
}

export default function StructureTree({
    items,
    selectedBlock,
    setSelectedBlock,
    dropIndicator,
    onDelete,
}: StructureTreeProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'structure-root',
    });

    return (
        <div
            ref={setNodeRef}
            className={`min-h-48 rounded border border-dashed p-2 transition ${
                isOver ? 'border-primary bg-primary/5' : 'border-border'
            }`}
        >
            {items.length === 0 ? (
                <div className="flex min-h-40 items-center justify-center text-center text-xs text-muted-foreground">
                    Drag block ke sini
                </div>
            ) : (
                <SortableContext
                    items={items.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-1">
                        {items.map((block) => (
                            <StructureItem
                                key={block.id}
                                block={block}
                                selectedBlock={selectedBlock}
                                setSelectedBlock={setSelectedBlock}
                                dropIndicator={dropIndicator}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                </SortableContext>
            )}
        </div>
    );
}

function StructureItem({
    block,
    selectedBlock,
    setSelectedBlock,
    dropIndicator,
    onDelete,
}: {
    block: BlockInstance;
    selectedBlock: BlockInstance | null;
    setSelectedBlock: (block: BlockInstance) => void;
    dropIndicator?: DropIndicator | null;
    onDelete: (id: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: block.id });
    const { setNodeRef: setChildrenDropRef, isOver: isOverChildren } =
        useDroppable({
            id: `inside-${block.id}`,
            data: {
                blockId: block.id,
                position: 'inside',
                source: 'structure-children',
            },
        });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isActive = selectedBlock?.id === block.id;
    const isDropTarget = dropIndicator?.id === block.id;
    const isBefore = isDropTarget && dropIndicator?.position === 'before';
    const isAfter = isDropTarget && dropIndicator?.position === 'after';
    const isInside = isDropTarget && dropIndicator?.position === 'inside';
    const canHaveChildren = NESTABLE_BLOCKS.includes(block.type);

    return (
        <div ref={setNodeRef} style={style} className="relative">
            {isBefore && <div className="mb-1 h-0.5 rounded bg-primary" />}

            <div
                className={`group flex items-center gap-1 rounded px-1.5 py-1 text-sm transition ${
                    isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                } ${isInside ? 'ring-1 ring-primary' : ''}`}
            >
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="cursor-grab rounded p-1 opacity-60 hover:opacity-100"
                    aria-label={`Move ${block.type}`}
                >
                    <GripVertical className="h-3.5 w-3.5" />
                </button>

                <button
                    type="button"
                    onClick={() => setSelectedBlock(block)}
                    className="min-w-0 flex-1 truncate text-left capitalize"
                >
                    {block.type}
                </button>

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(block.id);
                    }}
                    className="rounded p-1 opacity-0 transition group-hover:opacity-100"
                    aria-label={`Delete ${block.type}`}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>

            {block.children && block.children.length > 0 && (
                <div className="mt-1 ml-4 border-l pl-2">
                    <SortableContext
                        items={block.children.map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-1">
                            {block.children.map((child) => (
                                <StructureItem
                                    key={child.id}
                                    block={child}
                                    selectedBlock={selectedBlock}
                                    setSelectedBlock={setSelectedBlock}
                                    dropIndicator={dropIndicator}
                                    onDelete={onDelete}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </div>
            )}

            {canHaveChildren &&
                (!block.children || block.children.length === 0) && (
                    <div
                        ref={setChildrenDropRef}
                        className={`mt-1 ml-8 rounded border border-dashed px-2 py-1.5 text-[11px] transition ${
                            isOverChildren || isInside
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border text-muted-foreground'
                        }`}
                    >
                        Drop inside {block.type}
                    </div>
                )}

            {isAfter && <div className="mt-1 h-0.5 rounded bg-primary" />}
        </div>
    );
}
