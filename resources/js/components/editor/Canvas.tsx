import { useDroppable } from '@dnd-kit/core';

export default function Canvas({ children, className = '' }: any) {
    const { setNodeRef } = useDroppable({
        id: 'canvas-root',
    });

    return (
        <div
            ref={setNodeRef}
            className={`min-h-75 rounded border bg-background p-4 ${className}`}
        >
            {children}
        </div>
    );
}
