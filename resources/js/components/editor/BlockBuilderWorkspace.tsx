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
    Table2,
} from 'lucide-react';
import { useState } from 'react';
import type React from 'react';
import { toast } from 'sonner';

import type { BlockInstance } from '@/types/block';
import BlockEditor from './BlockEditor';
import BlockRenderer from './BlockRenderer';
import Canvas from './Canvas';
import { createBlock } from './blocks/factory';
import {
    findAndRemove,
    getDropPosition,
    insertWithPosition,
} from './core/tree';
import StructureTree from './StructureTree';
import { Card } from '../ui/card';

type DropPosition = 'before' | 'after' | 'inside';

interface DropIndicator {
    id: number | string;
    position: DropPosition;
}

interface Props {
    blocks: BlockInstance[];
    onChange: (blocks: BlockInstance[]) => void;
    metadataPanel?: React.ReactNode;
}

const blockGroups = [
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
            { type: 'table', title: 'Table', icon: Table2 },
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
        return {
            id: Number(id.replace('preview-', '')),
        };
    }

    if (typeof id === 'string' && id.startsWith('inside-')) {
        return {
            id: Number(id.replace('inside-', '')),
            position: 'inside' as DropPosition,
        };
    }

    return { id };
};

function DraggableBlock({ item, onClick }: any) {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: item.type,
        data: {
            type: item.type,
            source: 'sidebar',
        },
    });

    return (
        <Card>
            <div
                ref={setNodeRef}
                {...listeners}
                {...attributes}
                onClick={onClick}
                className="flex h-20 w-full cursor-move items-center justify-center px-2 py-2 text-center"
            >
                <div className="flex min-w-0 flex-col items-center gap-1">
                    <item.icon className="h-5 w-5 text-primary" />
                    <span className="text-xs leading-tight font-medium break-words">
                        {item.title}
                    </span>
                </div>
            </div>
        </Card>
    );
}

export default function BlockBuilderWorkspace({
    blocks,
    onChange,
    metadataPanel,
}: Props) {
    const [selectedBlock, setSelectedBlock] = useState<BlockInstance | null>(
        null,
    );
    const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(
        null,
    );

    const updateBlock = (
        id: number,
        newData: Record<string, any>,
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

        onChange(updateRecursive(blocks));

        if (selectedBlock?.id === id) {
            setSelectedBlock((previous) =>
                previous
                    ? {
                          ...previous,
                          [target]: {
                              ...(previous[target] ?? {}),
                              ...newData,
                          },
                      }
                    : previous,
            );
        }
    };

    const addBlock = (type: string) => {
        const newBlock = createBlock(type);

        onChange([...blocks, newBlock]);
        setSelectedBlock(newBlock);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            return;
        }

        const cloned = structuredClone(blocks);
        const position = getDropPosition(event);
        const target = resolveDropTarget(over.id as number | string);
        const targetPosition = target.position ?? position;
        const isSidebarBlock = active.data.current?.source === 'sidebar';
        const isRootDrop =
            target.id === 'canvas-root' || target.id === 'structure-root';

        if (isSidebarBlock) {
            const newBlock = createBlock(active.id as string);

            if (blocks.length === 0 || isRootDrop) {
                onChange(
                    isRootDrop && blocks.length > 0
                        ? [...blocks, newBlock]
                        : [newBlock],
                );
                setSelectedBlock(newBlock);
                setDropIndicator(null);

                return;
            }

            insertWithPosition(
                cloned,
                target.id as number,
                newBlock,
                targetPosition,
            );
            onChange(cloned);
            setSelectedBlock(newBlock);
            setDropIndicator(null);

            return;
        }

        if (active.id === over.id) {
            return;
        }

        const moving = findAndRemove(cloned, active.id as number);

        if (!moving) {
            return;
        }

        if (isRootDrop) {
            cloned.push(moving);
        } else {
            insertWithPosition(
                cloned,
                target.id as number,
                moving,
                targetPosition,
            );
        }

        onChange(cloned);
        setDropIndicator(null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        if (!event.over) {
            return;
        }

        const target = resolveDropTarget(event.over.id as number | string);

        setDropIndicator({
            id: target.id,
            position: target.position ?? getDropPosition(event),
        });
    };

    const deleteBlock = (id: number) => {
        const cloned = structuredClone(blocks);
        const removed = findAndRemove(cloned, id);

        if (!removed) {
            return;
        }

        onChange(cloned);

        if (selectedBlock?.id === id) {
            setSelectedBlock(null);
        }

        toast.success('Block deleted');
    };

    return (
        <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
        >
            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[280px_minmax(420px,1fr)_280px_300px_360px]">
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

                <aside className="min-h-0 overflow-y-auto border-t bg-background p-4 xl:border-t-0 xl:border-l">
                    {metadataPanel}
                </aside>
            </div>
        </DndContext>
    );
}
