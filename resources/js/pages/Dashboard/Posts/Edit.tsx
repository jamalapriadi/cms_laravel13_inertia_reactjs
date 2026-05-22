import { useDraggable } from '@dnd-kit/core';
import {
    DndContext,
    closestCenter,
    DragEndEvent,
    DragOverEvent,
} from '@dnd-kit/core';
import { Head, useForm } from '@inertiajs/react';

import {
    Text,
    Heading,
    List,
    Quote,
    Code,
    Image as ImageIcon,
    MousePointerClick,
    AlignLeft,
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import BlockEditor from '@/components/editor/BlockEditor';
import { createBlock } from '@/components/editor/blocks/factory';
import Canvas from '@/components/editor/Canvas';
import {
    findAndRemove,
    insertWithPosition,
    getDropPosition,
} from '@/components/editor/core/tree';

import SortableTree from '@/components/editor/SortableTree';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import AppLayout from '@/layouts/post-layout';

/**
 * ✅ TYPES
 */
type DropPosition = 'before' | 'after' | 'inside';

interface DropIndicator {
    id: number;
    position: DropPosition;
}

interface BlockInstance {
    id: number;
    type: string;
    data: Record<string, any>;
    children?: BlockInstance[];
}

/**
 * DRAG ITEM (SIDEBAR)
 */
function DraggableBlock({ item, disabled, onClick }: any) {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: item.type, // 🔥 simple & stable
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
                className={`w-full px-3 py-2 text-left ${
                    disabled ? 'opacity-50' : 'cursor-move'
                }`}
            >
                <div className="flex flex-col gap-1">
                    <item.icon className="h-5 w-5 text-primary" />
                    <span className="text-xs font-medium">{item.title}</span>
                </div>
            </div>
        </Card>
    );
}

/**
 * EDIT PAGE
 */
export default function Edit({ post, blocks }: any) {
    const [initialized, setInitialized] = useState(false);
    const [pageBlocks, setPageBlocks] = useState<BlockInstance[]>([]);
    const [selectedBlock, setSelectedBlock] = useState<BlockInstance | null>(
        null,
    );

    const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(
        null,
    );

    /**
     * ✅ BLOCK LIST
     */
    const blockType = [
        // { type: 'section', title: 'Section', icon: Layout },
        // { type: 'column', title: 'Column', icon: Columns },
        // { type: 'grid', title: 'Grid', icon: Grid },
        // { type: 'grid-item', title: 'Grid Item', icon: Columns },
        { type: 'heading', title: 'Heading', icon: Heading },
        { type: 'text', title: 'Text', icon: Text },
        { type: 'paragraph', title: 'Paragraph', icon: AlignLeft },
        { type: 'image', title: 'Image', icon: ImageIcon },
        { type: 'button', title: 'Button', icon: MousePointerClick },
        { type: 'list', title: 'List', icon: List },
        { type: 'quote', title: 'Quote', icon: Quote },
        { type: 'code', title: 'Code', icon: Code },
    ];

    /**
     * FORM (NO MORE content FIELD)
     */
    const { data, setData, put, processing, errors } = useForm({
        title: post.title ?? '',
        status: post.status ?? 'draft',
        blocks: '',
    });

    /**
     * INIT FROM BACKEND (IMPORTANT)
     */
    useEffect(() => {
        if (blocks) {
            setPageBlocks(blocks);
        }
        setInitialized(true);
    }, [blocks]);

    /**
     * SYNC BLOCKS TO FORM
     */
    useEffect(() => {
        setData('blocks', JSON.stringify(pageBlocks));
    }, [pageBlocks]);

    /**
     * UPDATE BLOCK
     */
    const updateBlock = (id: number, newData: Record<string, any>) => {
        const updateRecursive = (items: BlockInstance[]): BlockInstance[] =>
            items.map((b) => {
                if (b.id === id) {
                    return {
                        ...b,
                        data: { ...b.data, ...newData },
                    };
                }

                if (b.children) {
                    return {
                        ...b,
                        children: updateRecursive(b.children),
                    };
                }

                return b;
            });

        setPageBlocks((prev) => updateRecursive(prev));

        /**
         * ✅ FIX: also update selectedBlock so the editor sidebar
         * reflects the latest data immediately while typing.
         */
        if (selectedBlock?.id === id) {
            setSelectedBlock((prev) =>
                prev ? { ...prev, data: { ...prev.data, ...newData } } : prev,
            );
        }
    };

    /**
     * ADD BLOCK
     */
    const addBlock = (type: string) => {
        const newBlock = createBlock(type);
        setPageBlocks((prev) => [...prev, newBlock]);
    };

    /**
     * DRAG END
     */
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const cloned = structuredClone(pageBlocks);
        const position = getDropPosition(event);

        const isSidebar = active.data.current?.source === 'sidebar';

        /**
         * FROM SIDEBAR
         */
        if (isSidebar) {
            const newBlock = createBlock(active.id as string);

            if (pageBlocks.length === 0) {
                setPageBlocks([newBlock]);
                return;
            }

            insertWithPosition(cloned, over.id as number, newBlock, position);

            setPageBlocks(cloned);
            return;
        }

        /**
         * MOVE EXISTING
         */
        if (active.id === over.id) return;

        const moving = findAndRemove(cloned, active.id as number);
        if (!moving) return;

        insertWithPosition(cloned, over.id as number, moving, position);

        setPageBlocks(cloned);
    };

    /**
     * DRAG OVER
     */
    const handleDragOver = (event: DragOverEvent) => {
        if (!event.over) return;

        setDropIndicator({
            id: event.over.id as number,
            position: getDropPosition(event),
        });
    };

    /**
     * DELETE BLOCK
     */
    const deleteBlock = (id: number) => {
        const cloned = structuredClone(pageBlocks);
        const removed = findAndRemove(cloned, id);

        if (!removed) return;

        setPageBlocks(cloned);

        if (selectedBlock?.id === id) {
            setSelectedBlock(null);
        }

        toast.success('Block deleted');
    };

    /**
     * UPDATE POST
     */
    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        put(`/dashboard/posts/${post.id}`, {
            preserveScroll: true,
            onStart: () => toast.loading('Updating...', { id: 'post' }),
            onSuccess: () => toast.success('Post updated', { id: 'post' }),
            onError: () => toast.error('Validation failed', { id: 'post' }),
        });
    };

    if (!initialized) return null;

    return (
        <>
            <Head title="Edit Post" />

            <div className="flex min-h-screen w-full flex-col lg:flex-row">
                {/* LEFT */}
                <aside className="hidden w-72 border-r bg-muted/30 p-4 lg:block">
                    <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase">
                        Blocks
                    </h2>

                    <div className="grid grid-cols-2 gap-2">
                        {blockType.map((item) => (
                            <DraggableBlock
                                key={item.type}
                                item={item}
                                // disabled={
                                //     !hasSection && item.type !== 'section'
                                // }
                                onClick={() => addBlock(item.type)} // fallback klik
                            />
                        ))}
                    </div>
                </aside>

                {/* MAIN */}
                <div className="flex-1 p-4 md:p-6">
                    <div className="mb-4 lg:hidden">
                        <div className="grid grid-cols-4 gap-2">
                            {blockType.map((item) => (
                                <button
                                    key={item.type}
                                    onClick={() => {
                                        const newBlock = createBlock(item.type);
                                        setPageBlocks((prev) => [
                                            ...prev,
                                            newBlock,
                                        ]);
                                        setSelectedBlock(newBlock);
                                    }}
                                    className="flex flex-col items-center justify-center rounded border p-2 text-xs"
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <Input
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Post title..."
                            className="h-14 text-2xl font-bold"
                        />

                        {errors.title && (
                            <p className="text-sm text-destructive">
                                {errors.title}
                            </p>
                        )}

                        {/* CANVAS */}
                        <Canvas>
                            <DndContext
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                                onDragOver={handleDragOver}
                            >
                                {pageBlocks.length === 0 ? (
                                    <div className="flex min-h-50 flex-col items-center justify-center rounded border border-dashed p-6 text-center">
                                        <p className="text-sm text-muted-foreground">
                                            Belum ada block
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground/70">
                                            Drag & drop block dari sidebar atau
                                            klik untuk menambahkan
                                        </p>

                                        <div className="mt-4 flex gap-2">
                                            <span className="rounded bg-muted px-2 py-1 text-xs">
                                                Tips:
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                Mulai dari Heading / Text
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <SortableTree
                                        items={pageBlocks}
                                        selectedBlock={selectedBlock}
                                        setSelectedBlock={setSelectedBlock}
                                        dropIndicator={dropIndicator}
                                        onDelete={deleteBlock}
                                    />
                                )}
                            </DndContext>
                        </Canvas>

                        {/* ERROR */}
                        {errors.content && (
                            <div className="rounded bg-red-100 p-3 text-sm text-red-600">
                                {errors.content}
                            </div>
                        )}

                        {/* PUBLISH */}
                        <div className="card bg-base-100 card-border">
                            <div className="card-body space-y-3">
                                <Select
                                    value={data.status}
                                    onValueChange={(val) =>
                                        setData('status', val)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">
                                            Draft
                                        </SelectItem>
                                        <SelectItem value="publish">
                                            Publish
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* RIGHT */}
                <aside className="w-80 border-l p-4">
                    {selectedBlock && (
                        <BlockEditor
                            block={selectedBlock}
                            updateBlock={updateBlock}
                        />
                    )}
                </aside>
            </div>
        </>
    );
}

Edit.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
