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

export default function Create() {
    const [initialized, setInitialized] = useState(false);
    const [selectedBlock, setSelectedBlock] = useState<BlockInstance | null>(
        null,
    );
    const [pageBlocks, setPageBlocks] = useState<BlockInstance[]>([]);
    const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(
        null,
    );

    /**
     * ✅ BLOCK LIST
     */
    const blocks = [
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
     * ✅ FORM
     */
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        content: '',
        status: 'draft',
    });

    useEffect(() => setInitialized(true), []);

    /**
     * ✅ SYNC CONTENT JSON
     */
    useEffect(() => {
        setData('content', JSON.stringify(pageBlocks));
    }, [pageBlocks]);

    /**
     * ✅ UPDATE BLOCK
     */
    const updateBlock = (id: number, newData: Record<string, any>) => {
        const updateRecursive = (blocks: BlockInstance[]): BlockInstance[] =>
            blocks.map((b) => {
                if (b.id === id) {
                    return { ...b, data: { ...b.data, ...newData } };
                }

                if (b.children) {
                    return { ...b, children: updateRecursive(b.children) };
                }

                return b;
            });

        setPageBlocks((prev) => updateRecursive(prev));

        if (selectedBlock?.id === id) {
            setSelectedBlock((prev) =>
                prev ? { ...prev, data: { ...prev.data, ...newData } } : prev,
            );
        }
    };

    /**
     * ✅ ADD BLOCK (SMART)
     */
    const addBlock = (type: string) => {
        // force create section first
        // if (pageBlocks.length === 0 && type !== 'section') {
        //     const section = createBlock('section');
        //     section.children[0].children.push(createBlock(type));

        //     setPageBlocks([section]);

        //     return;
        // }

        const newBlock = createBlock(type);
        setPageBlocks((prev) => [...prev, newBlock]);
        setSelectedBlock(newBlock);
    };

    /**
     * ✅ SUBMIT
     */
    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/dashboard/posts', {
            preserveScroll: true,
            onStart: () => toast.loading('Saving...', { id: 'post' }),
            onSuccess: () => toast.success('Post created', { id: 'post' }),
            onError: () => toast.error('Validation failed', { id: 'post' }),
        });
    };

    /**
     * ✅ DRAG END
     */
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const position = getDropPosition(event);

        const cloned = structuredClone(pageBlocks);

        const isSidebarBlock = active.data.current?.source === 'sidebar';

        /**
         * 🔥 CASE 1: FROM SIDEBAR
         */
        if (isSidebarBlock) {
            const newBlock = createBlock(active.id as string);

            // ⚠️ kalau drop ke canvas kosong
            if (pageBlocks.length === 0) {
                setPageBlocks([newBlock]);
                return;
            }

            insertWithPosition(cloned, over.id as number, newBlock, position);

            setPageBlocks(cloned);
            setDropIndicator(null);
            return;
        }

        /**
         * 🔥 CASE 2: MOVE EXISTING BLOCK
         */
        if (active.id === over.id) return;

        const moving = findAndRemove(cloned, active.id as number);

        if (!moving) return;

        insertWithPosition(cloned, over.id as number, moving, position);

        setPageBlocks(cloned);
        setDropIndicator(null);
    };

    /**
     * ✅ DRAG OVER
     */
    const handleDragOver = (event: DragOverEvent) => {
        if (!event.over) {
            return;
        }

        setDropIndicator({
            id: event.over.id as number,
            position: getDropPosition(event),
        });
    };

    const deleteBlock = (id: number) => {
        const cloned = structuredClone(pageBlocks);

        const removed = findAndRemove(cloned, id);

        if (!removed) {
            return;
        }

        setPageBlocks(cloned);

        // reset selected jika yang dihapus adalah active
        if (selectedBlock?.id === id) {
            setSelectedBlock(null);
        }

        toast.success('Block deleted');
    };

    /**
     * ✅ GUARD
     */
    if (!initialized) {
        return null;
    }

    const hasSection = pageBlocks.some((b) => b.type === 'section');

    return (
        <>
            <Head title="Create Post" />

            <div className="flex min-h-screen w-full flex-col lg:flex-row">
                {/* LEFT SIDEBAR */}
                <aside className="hidden w-72 border-r bg-muted/30 p-4 lg:block">
                    <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase">
                        Blocks
                    </h2>

                    <div className="grid grid-cols-2 gap-2">
                        {blocks.map((item) => (
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
                            {blocks.map((item) => (
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
                                    <div className="flex min-h-[200px] flex-col items-center justify-center rounded border border-dashed p-6 text-center">
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

                {/* RIGHT SIDEBAR */}
                <aside className="hidden w-80 border-l bg-muted/30 p-4 lg:block">
                    {selectedBlock && (
                        <div className="card bg-base-100 card-border">
                            <div className="card-body">
                                <h2 className="card-title">
                                    Edit: {selectedBlock.type}
                                </h2>

                                <BlockEditor
                                    block={selectedBlock}
                                    updateBlock={updateBlock}
                                />
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </>
    );
}

Create.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
