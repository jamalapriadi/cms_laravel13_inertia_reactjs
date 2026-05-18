import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';

import BlockRenderer from './BlockRenderer';
import type { BlockInstance } from '@/types/block';

/**
 * ✅ TYPES
 */
type DropPosition = 'before' | 'after' | 'inside';

interface DropIndicator {
    id: number;
    position: DropPosition;
}

interface SortableItemProps {
    block: BlockInstance;
    selectedBlock: BlockInstance | null;
    setSelectedBlock: (block: BlockInstance) => void;
    dropIndicator?: DropIndicator | null;
    onDelete: (id: number) => void;
}

export default function SortableItem({
    block,
    selectedBlock,
    setSelectedBlock,
    dropIndicator,
    onDelete,
}: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: block.id });

    /**
     * ✅ STYLE
     */
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    /**
     * ✅ STATE
     */
    const isActive = selectedBlock?.id === block.id;
    const isDropTarget = dropIndicator?.id === block.id;

    const isBefore = isDropTarget && dropIndicator?.position === 'before';
    const isAfter = isDropTarget && dropIndicator?.position === 'after';
    const isInside = isDropTarget && dropIndicator?.position === 'inside';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className="group relative"
        >
            {/* 🔵 BEFORE */}
            {isBefore && (
                <div className="mb-1 h-1 w-full rounded bg-blue-500" />
            )}

            {/* 🔵 BLOCK */}
            <div className="relative">
                {/* DRAG HANDLE */}
                <div
                    {...listeners}
                    className="absolute top-0 left-0 z-10 cursor-move p-1 text-xs opacity-0 transition group-hover:opacity-100"
                >
                    ☰
                </div>

                {/* DELETE BUTTON */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(block.id);
                    }}
                    className="absolute top-0 right-0 z-20 cursor-pointer p-1 text-red-500 opacity-0 transition group-hover:opacity-100 hover:text-red-700"
                >
                    <Trash2 className="h-40 w-40" />
                </button>

                {/* 🔵 INSIDE */}
                {isInside && (
                    <div className="pointer-events-none absolute inset-0 z-10 rounded border-2 border-blue-400" />
                )}

                <BlockRenderer
                    block={block}
                    isActive={isActive}
                    onClick={() => setSelectedBlock(block)}
                />
            </div>

            {/* 🔵 AFTER */}
            {isAfter && <div className="mt-1 h-1 w-full rounded bg-blue-500" />}
        </div>
    );
}
