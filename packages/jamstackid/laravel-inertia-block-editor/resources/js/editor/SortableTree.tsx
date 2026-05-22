import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';

import type { BlockInstance } from '../types/block';
import BlockRenderer from './BlockRenderer';

/**
 * ✅ TYPES
 */
type DropPosition = 'before' | 'after' | 'inside';

interface DropIndicator {
    id: number;
    position: DropPosition;
}

interface SortableTreeProps {
    items: BlockInstance[];
    selectedBlock: BlockInstance | null;
    setSelectedBlock: (block: BlockInstance) => void;
    dropIndicator?: DropIndicator | null;
    onDelete: (id: number) => void;
}

/**
 * 🌳 ROOT
 */
export default function SortableTree({
    items,
    selectedBlock,
    setSelectedBlock,
    dropIndicator,
    onDelete,
}: SortableTreeProps) {
    return (
        <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
        >
            {items.map((block) => (
                <SortableItem
                    key={block.id}
                    block={block}
                    selectedBlock={selectedBlock}
                    setSelectedBlock={setSelectedBlock}
                    dropIndicator={dropIndicator}
                    onDelete={onDelete}
                />
            ))}
        </SortableContext>
    );
}

/**
 * 🌿 ITEM (RECURSIVE)
 */
function SortableItem({
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

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isActive = selectedBlock?.id === block.id;
    const isDropTarget = dropIndicator?.id === block.id;

    const isBefore = isDropTarget && dropIndicator?.position === 'before';
    const isAfter = isDropTarget && dropIndicator?.position === 'after';
    const isInside = isDropTarget && dropIndicator?.position === 'inside';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group relative mb-3 ml-2 border-l pl-3"
        >
            {/* 🔵 BEFORE */}
            {isBefore && (
                <div className="mb-1 h-1 w-full rounded bg-blue-500" />
            )}

            {/* 🔵 BLOCK */}
            <div className="relative flex items-start gap-2">
                {/* ✅ DRAG HANDLE ONLY */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-move p-1 text-muted-foreground hover:text-foreground"
                >
                    ☰
                </div>

                {/* ✅ CONTENT (CLICK SAFE) */}
                <div
                    className="relative flex-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBlock(block);
                    }}
                >
                    {/* INSIDE */}
                    {isInside && (
                        <div className="pointer-events-none absolute inset-0 z-10 rounded border-2 border-blue-400" />
                    )}

                    <BlockRenderer
                        block={block}
                        isActive={isActive}
                        onClick={() => setSelectedBlock(block)}
                    />

                    {/* DELETE */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(block.id);
                        }}
                        className="absolute top-1 right-1 z-20 rounded bg-card p-1 text-red-500 opacity-0 shadow transition group-hover:opacity-100"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* 🔵 CHILDREN */}
            {block.children && block.children.length > 0 && (
                <div className="mt-2">
                    <SortableTree
                        items={block.children}
                        selectedBlock={selectedBlock}
                        setSelectedBlock={setSelectedBlock}
                        dropIndicator={dropIndicator}
                        onDelete={onDelete} // ✅ FIX penting
                    />
                </div>
            )}

            {/* 🔵 AFTER */}
            {isAfter && <div className="mt-1 h-1 w-full rounded bg-blue-500" />}
        </div>
    );
}
