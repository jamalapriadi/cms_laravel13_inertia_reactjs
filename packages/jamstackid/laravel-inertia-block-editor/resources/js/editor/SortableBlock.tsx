import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BlockInstance } from '../types/block';
import BlockRenderer from './BlockRenderer';

interface Props {
    block: BlockInstance;
    selectedId?: number;
    onSelect?: (block: BlockInstance) => void;
}

export default function SortableBlock({ block, selectedId, onSelect }: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: transform ? CSS.Transform.toString(transform) : undefined,
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="group relative">
            {/* 🔥 DRAG HANDLE */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-1 left-1 z-10 cursor-grab rounded bg-muted px-2 py-1 text-xs opacity-0 transition group-hover:opacity-100"
            >
                ☰
            </div>

            {/* 🔥 BLOCK */}
            <BlockRenderer
                block={block}
                isActive={selectedId === block.id}
                onClick={() => onSelect?.(block)}
            />
        </div>
    );
}
