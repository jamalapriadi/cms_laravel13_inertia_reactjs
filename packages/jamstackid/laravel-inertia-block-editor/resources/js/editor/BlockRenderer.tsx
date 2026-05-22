import { useDroppable } from '@dnd-kit/core';

import type { BlockInstance } from '../types/block';
import { BLOCK_REGISTRY } from './blocks/registry';
import { buildBlockStyle, buildVisibilityClass } from './style';

interface Props {
    block: BlockInstance;
    isActive?: boolean;
    onClick?: () => void;
}

export default function BlockRenderer({
    block,
    isActive = false,
    onClick,
}: Props) {
    const Component = BLOCK_REGISTRY[block.type];
    const { setNodeRef, isOver } = useDroppable({
        id: `preview-${block.id}`,
        data: {
            blockId: block.id,
            source: 'preview',
        },
    });

    if (!Component) {
        return null;
    }

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            style={buildBlockStyle(block.styles)}
            className={`relative cursor-pointer rounded border p-2 transition ${buildVisibilityClass(block.styles)} ${
                isActive || isOver
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-border hover:border-muted-foreground/40'
            }`}
        >
            {Component.render({
                data: block.data,
                styles: block.styles,

                /**
                 * 🔥 recursive children render
                 */
                children: block.children?.map((child) => (
                    <BlockRenderer
                        key={child.id}
                        block={child}
                        isActive={false}
                    />
                )),
            })}
        </div>
    );
}
