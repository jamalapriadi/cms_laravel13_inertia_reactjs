import { DndContext, closestCenter, useDraggable } from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import {
    Columns2,
    Container,
    FileText,
    GalleryHorizontal,
    Heading,
    Image as ImageIcon,
    Layers,
    LayoutGrid,
    LayoutPanelTop,
    ListCollapse,
    Minus,
    MousePointerClick,
    MoveVertical,
    PanelTop,
    Pilcrow,
    Rows3,
    Smile,
    SquareStack,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';

import type { BlockInstance, BlockType } from '../types/block';
import BlockEditor from './BlockEditor';
import BlockRenderer from './BlockRenderer';
import { createBlock } from './blocks/factory';
import Canvas from './Canvas';
import {
    findAndRemove,
    getDropPosition,
    insertWithPosition,
} from './core/tree';
import StructureTree from './StructureTree';

type DropPosition = 'before' | 'after' | 'inside';

interface DropIndicator {
    id: number | string;
    position: DropPosition;
}

interface BlockItem {
    type: BlockType;
    title: string;
    icon: ComponentType<{ className?: string }>;
}

interface BlockBuilderProps {
    value?: BlockInstance[];
    onChange?: (blocks: BlockInstance[]) => void;
    className?: string;
}

const blockGroups: Array<{ title: string; items: BlockItem[] }> = [
    {
        title: 'Basic',
        items: [
            { type: 'heading', title: 'Heading', icon: Heading },
            { type: 'paragraph', title: 'Paragraph', icon: Pilcrow },
            { type: 'rich-editor', title: 'Rich Editor', icon: FileText },
            { type: 'image', title: 'Image', icon: ImageIcon },
            { type: 'button', title: 'Button', icon: MousePointerClick },
            { type: 'icon', title: 'Icon', icon: Smile },
            { type: 'divider', title: 'Divider', icon: Minus },
            { type: 'spacer', title: 'Spacer', icon: MoveVertical },
        ],
    },
    {
        title: 'Layout',
        items: [
            { type: 'section', title: 'Section', icon: LayoutPanelTop },
            { type: 'container', title: 'Container', icon: Container },
            { type: 'grid', title: 'Grid', icon: LayoutGrid },
            { type: 'columns', title: 'Columns', icon: Columns2 },
            { type: 'flex-row', title: 'Flex Row', icon: Rows3 },
            { type: 'flex-column', title: 'Flex Column', icon: PanelTop },
            { type: 'card', title: 'Card', icon: SquareStack },
            { type: 'tabs', title: 'Tabs', icon: Layers },
            { type: 'accordion', title: 'Accordion', icon: ListCollapse },
            { type: 'slider', title: 'Slider', icon: GalleryHorizontal },
        ],
    },
];

const resolveDropTarget = (id: number | string) => {
    if (typeof id === 'string' && id.startsWith('preview-')) {
        return { id: Number(id.replace('preview-', '')) };
    }

    if (typeof id === 'string' && id.startsWith('inside-')) {
        return {
            id: Number(id.replace('inside-', '')),
            position: 'inside' as DropPosition,
        };
    }

    return { id };
};

function DraggableBlock({
    item,
    onClick,
}: {
    item: BlockItem;
    onClick: () => void;
}) {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: item.type,
        data: {
            type: item.type,
            source: 'sidebar',
        },
    });

    return (
        <div className="rounded border bg-background shadow-xs">
            <button
                ref={setNodeRef}
                {...listeners}
                {...attributes}
                type="button"
                onClick={onClick}
                className="flex h-20 w-full cursor-move items-center justify-center px-2 py-2 text-center"
            >
                <span className="flex min-w-0 flex-col items-center gap-1">
                    <item.icon className="h-5 w-5 text-primary" />
                    <span className="text-xs leading-tight font-medium break-words">
                        {item.title}
                    </span>
                </span>
            </button>
        </div>
    );
}

export default function BlockBuilder({
    value = [],
    onChange,
    className = '',
}: BlockBuilderProps) {
    const [blocks, setBlocks] = useState<BlockInstance[]>(value);
    const [selectedBlock, setSelectedBlock] = useState<BlockInstance | null>(
        null,
    );
    const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(
        null,
    );

    useEffect(() => {
        setBlocks(value);
    }, [value]);

    const commitBlocks = (nextBlocks: BlockInstance[]) => {
        setBlocks(nextBlocks);
        onChange?.(nextBlocks);
    };

    const addBlock = (type: BlockType) => {
        commitBlocks([...blocks, createBlock(type)]);
    };

    const updateBlock = (
        id: number,
        newData: Record<string, unknown>,
        target: 'data' | 'styles' = 'data',
    ) => {
        const updateRecursive = (items: BlockInstance[]): BlockInstance[] =>
            items.map((block) => {
                if (block.id === id) {
                    return {
                        ...block,
                        [target]: { ...(block[target] ?? {}), ...newData },
                    };
                }

                if (block.children) {
                    return {
                        ...block,
                        children: updateRecursive(block.children),
                    };
                }

                return block;
            });

        const nextBlocks = updateRecursive(blocks);
        commitBlocks(nextBlocks);

        if (selectedBlock?.id === id) {
            setSelectedBlock((current) =>
                current
                    ? {
                          ...current,
                          [target]: { ...(current[target] ?? {}), ...newData },
                      }
                    : current,
            );
        }
    };

    const deleteBlock = (id: number) => {
        const removeRecursive = (items: BlockInstance[]): BlockInstance[] =>
            items
                .filter((block) => block.id !== id)
                .map((block) => ({
                    ...block,
                    children: block.children
                        ? removeRecursive(block.children)
                        : [],
                }));

        commitBlocks(removeRecursive(blocks));

        if (selectedBlock?.id === id) {
            setSelectedBlock(null);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            setDropIndicator(null);

            return;
        }

        const target = resolveDropTarget(over.id);

        setDropIndicator({
            id: target.id,
            position: target.position ?? getDropPosition(event),
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setDropIndicator(null);

        if (!over) {
            return;
        }

        const cloned = structuredClone(blocks);
        const target = resolveDropTarget(over.id);
        const position = target.position ?? getDropPosition(event);
        const isRootDrop =
            target.id === 'canvas-root' || target.id === 'structure-root';

        if (active.data.current?.source === 'sidebar') {
            const newBlock = createBlock(
                active.data.current?.type as BlockType,
            );

            if (blocks.length === 0 || isRootDrop) {
                commitBlocks(
                    isRootDrop && blocks.length > 0
                        ? [...blocks, newBlock]
                        : [newBlock],
                );

                setSelectedBlock(newBlock);

                return;
            }

            insertWithPosition(cloned, target.id as number, newBlock, position);
            commitBlocks(cloned);
            setSelectedBlock(newBlock);

            return;
        }

        if (active.id === over.id) {
            return;
        }

        const moving = findAndRemove(cloned, Number(active.id));

        if (!moving) {
            return;
        }

        if (isRootDrop) {
            cloned.push(moving);
        } else {
            insertWithPosition(cloned, target.id as number, moving, position);
        }

        commitBlocks(cloned);
    };

    return (
        <DndContext
            collisionDetection={closestCenter}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div
                className={`grid min-h-[720px] grid-cols-1 overflow-hidden rounded border xl:grid-cols-[280px_minmax(420px,1fr)_280px_360px] ${className}`}
            >
                <aside className="min-h-0 overflow-y-auto border-b bg-muted/30 p-3 xl:border-r xl:border-b-0">
                    <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Blocks
                    </h2>

                    <div className="space-y-4">
                        {blockGroups.map((group) => (
                            <section key={group.title}>
                                <h3 className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                                    {group.title}
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {group.items.map((item) => (
                                        <DraggableBlock
                                            key={item.type}
                                            item={item}
                                            onClick={() => addBlock(item.type)}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </aside>

                <main className="min-h-0 overflow-y-auto bg-muted/20 p-4">
                    <Canvas className="mx-auto min-h-full max-w-6xl shadow-sm">
                        {blocks.length === 0 ? (
                            <div className="flex min-h-[420px] flex-col items-center justify-center rounded border border-dashed p-6 text-center">
                                <p className="text-sm font-medium">
                                    Belum ada block
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Pilih block dari panel kiri atau drag ke
                                    struktur.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {blocks.map((block) => (
                                    <BlockRenderer
                                        key={block.id}
                                        block={block}
                                        isActive={
                                            selectedBlock?.id === block.id
                                        }
                                        onClick={() => setSelectedBlock(block)}
                                    />
                                ))}
                            </div>
                        )}
                    </Canvas>
                </main>

                <aside className="min-h-0 overflow-y-auto border-t bg-background p-3 xl:border-t-0 xl:border-l">
                    <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Structure
                    </h2>

                    <StructureTree
                        items={blocks}
                        selectedBlock={selectedBlock}
                        setSelectedBlock={setSelectedBlock}
                        dropIndicator={dropIndicator}
                        onDelete={deleteBlock}
                    />
                </aside>

                <aside className="min-h-0 overflow-y-auto border-t bg-muted/30 p-4 xl:border-t-0 xl:border-l">
                    {selectedBlock ? (
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    Inspector
                                </p>
                                <h2 className="mt-1 text-base font-semibold capitalize">
                                    {selectedBlock.type}
                                </h2>
                            </div>

                            <BlockEditor
                                block={selectedBlock}
                                updateBlock={updateBlock}
                            />
                        </div>
                    ) : (
                        <div className="flex min-h-48 items-center justify-center rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
                            Pilih block di struktur untuk mengedit.
                        </div>
                    )}
                </aside>
            </div>
        </DndContext>
    );
}
