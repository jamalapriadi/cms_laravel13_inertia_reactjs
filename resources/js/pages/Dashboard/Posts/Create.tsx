import { useDraggable } from '@dnd-kit/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { Head, useForm } from '@inertiajs/react';

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

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { store } from '@/actions/App/Http/Controllers/Dashboard/PostController';
import BlockEditor from '@/components/editor/BlockEditor';
import BlockRenderer from '@/components/editor/BlockRenderer';
import { createBlock } from '@/components/editor/blocks/factory';
import Canvas from '@/components/editor/Canvas';
import {
    findAndRemove,
    getDropPosition,
    insertWithPosition,
} from '@/components/editor/core/tree';
import StructureTree from '@/components/editor/StructureTree';

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

import PostEditorLayout from '@/layouts/post-editor-layout';
import type { BlockInstance } from '@/types/block';
import PostMetadataPanel from './components/PostMetadataPanel';

type DropPosition = 'before' | 'after' | 'inside';

type PostFormData = {
    title: string;
    content: string;
    status: string;
    category_id: string;
    tags: number[];
    tag_names: string[];
    featured_image: string;
    published_at: string;
};

interface DropIndicator {
    id: number | string;
    position: DropPosition;
}

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
                className={`flex h-20 w-full items-center justify-center px-2 py-2 text-center ${
                    disabled ? 'opacity-50' : 'cursor-move'
                }`}
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

export default function Create({ categories = [], tags = [] }: any) {
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

    /**
     * ✅ FORM
     */
    const { data, setData, post, processing, errors } = useForm<PostFormData>({
        title: '',
        content: '',
        status: 'draft',
        category_id: '',
        tags: [],
        tag_names: [],
        featured_image: '',
        published_at: '',
    });

    /**
     * ✅ SYNC CONTENT JSON
     */
    useEffect(() => {
        setData('content', JSON.stringify(pageBlocks));
    }, [pageBlocks, setData]);

    /**
     * ✅ UPDATE BLOCK
     */
    const updateBlock = (
        id: number,
        newData: Record<string, any>,
        target: 'data' | 'styles' = 'data',
    ) => {
        const updateRecursive = (blocks: BlockInstance[]): BlockInstance[] =>
            blocks.map((b) => {
                if (b.id === id) {
                    return {
                        ...b,
                        [target]: { ...(b[target] ?? {}), ...newData },
                    };
                }

                if (b.children) {
                    return { ...b, children: updateRecursive(b.children) };
                }

                return b;
            });

        setPageBlocks((prev) => updateRecursive(prev));

        if (selectedBlock?.id === id) {
            setSelectedBlock((prev) =>
                prev
                    ? {
                          ...prev,
                          [target]: { ...(prev[target] ?? {}), ...newData },
                      }
                    : prev,
            );
        }
    };

    /**
     * ✅ ADD BLOCK (SMART)
     */
    const addBlock = (type: string) => {
        const newBlock = createBlock(type);

        setPageBlocks((prev) => [...prev, newBlock]);
        setSelectedBlock(newBlock);
    };

    /**
     * ✅ SUBMIT
     */
    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post(store().url, {
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

        if (!over) {
            return;
        }

        const position = getDropPosition(event);

        const cloned = structuredClone(pageBlocks);
        const target = resolveDropTarget(over.id as number | string);
        const targetPosition = target.position ?? position;

        const isSidebarBlock = active.data.current?.source === 'sidebar';
        const isRootDrop =
            target.id === 'canvas-root' || target.id === 'structure-root';

        /**
         * 🔥 CASE 1: FROM SIDEBAR
         */
        if (isSidebarBlock) {
            const newBlock = createBlock(active.id as string);

            if (pageBlocks.length === 0 || isRootDrop) {
                setPageBlocks((prev) =>
                    isRootDrop && prev.length > 0
                        ? [...prev, newBlock]
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

            setPageBlocks(cloned);
            setSelectedBlock(newBlock);
            setDropIndicator(null);

            return;
        }

        /**
         * 🔥 CASE 2: MOVE EXISTING BLOCK
         */
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
            id: resolveDropTarget(event.over.id as number | string).id,
            position:
                resolveDropTarget(event.over.id as number | string).position ??
                getDropPosition(event),
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

    return (
        <>
            <Head title="Create Post" />

            <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
            >
                <form
                    onSubmit={submit}
                    className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden bg-background"
                >
                    <header className="flex shrink-0 flex-col gap-3 border-b bg-background px-4 py-3 xl:flex-row xl:items-center">
                        <Input
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Post title..."
                            className="h-10 text-lg font-semibold xl:max-w-xl"
                        />

                        <div className="flex items-center gap-2 xl:ml-auto">
                            <Select
                                value={data.status}
                                onValueChange={(val) => setData('status', val)}
                            >
                                <SelectTrigger className="w-36">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="publish">
                                        Publish
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Save'}
                            </Button>
                        </div>

                        {(errors.title || errors.content) && (
                            <div className="text-sm text-destructive">
                                {errors.title || errors.content}
                            </div>
                        )}
                    </header>

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
                                                    onClick={() =>
                                                        addBlock(item.type)
                                                    }
                                                />
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        </aside>

                        <main className="min-h-0 overflow-y-auto bg-muted/20 p-4">
                            <Canvas className="mx-auto min-h-full max-w-6xl shadow-sm">
                                {pageBlocks.length === 0 ? (
                                    <div className="flex min-h-[420px] flex-col items-center justify-center rounded border border-dashed p-6 text-center">
                                        <p className="text-sm font-medium">
                                            Belum ada block
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Pilih block dari panel kiri atau
                                            drag ke struktur.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {pageBlocks.map((block) => (
                                            <BlockRenderer
                                                key={block.id}
                                                block={block}
                                                isActive={
                                                    selectedBlock?.id ===
                                                    block.id
                                                }
                                                onClick={() =>
                                                    setSelectedBlock(block)
                                                }
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
                                items={pageBlocks}
                                selectedBlock={selectedBlock}
                                setSelectedBlock={setSelectedBlock}
                                dropIndicator={dropIndicator}
                                onDelete={deleteBlock}
                            />
                        </aside>

                        <aside className="min-h-0 overflow-y-auto border-t bg-background p-4 xl:border-t-0 xl:border-l">
                            <PostMetadataPanel
                                categories={categories}
                                tags={tags}
                                selectedCategoryId={data.category_id}
                                selectedTagNames={data.tag_names}
                                featuredImage={data.featured_image}
                                publishedAt={data.published_at}
                                onCategoryChange={(id) =>
                                    setData('category_id', id)
                                }
                                onTagNamesChange={(names) =>
                                    setData('tag_names', names)
                                }
                                onFeaturedImageChange={(path) =>
                                    setData('featured_image', path ?? '')
                                }
                                onPublishedAtChange={(value) =>
                                    setData('published_at', value)
                                }
                            />
                        </aside>
                    </div>
                </form>
            </DndContext>
        </>
    );
}

Create.layout = (page: React.ReactNode) => (
    <PostEditorLayout
        breadcrumbs={[
            { title: 'Posts', href: '/my-admin/dashboard/posts' },
            { title: 'Create', href: '/my-admin/dashboard/posts/create' },
        ]}
    >
        {page}
    </PostEditorLayout>
);
