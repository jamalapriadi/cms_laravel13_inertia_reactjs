import { useDroppable } from '@dnd-kit/core';

export default function Canvas({ children }: any) {
    const { setNodeRef } = useDroppable({
        id: 'canvas-root',
    });

    return (
        <div ref={setNodeRef} className="min-h-75 rounded border p-4">
            {children}
        </div>
    );
}
