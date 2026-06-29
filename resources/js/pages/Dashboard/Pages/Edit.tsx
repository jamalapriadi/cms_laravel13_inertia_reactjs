import { Head, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type React from 'react';
import { toast } from 'sonner';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';

import { update } from '@/actions/App/Http/Controllers/Dashboard/PageController';
import BlockBuilderWorkspace from '@/components/editor/BlockBuilderWorkspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import PageEditorLayout from '@/layouts/page-editor-layout';
import type { BlockInstance } from '@/types/block';
import { DEFAULT_CONTENT_EDITOR } from '@/utils/content-editor';
import type { ContentEditorMode } from '@/utils/content-editor';
import ClassicPageEdit from './components/ClassicPageEdit';
import PageMetadataPanel from './components/PageMetadataPanel';

type PageFormData = {
    title: string;
    slug: string;
    excerpt: string;
    blocks: string;
    status: string;
    featured_image: string;
    seo_title: string;
    seo_description: string;
    seo_keywords: string;
    og_image: string;
    published_at: string;
};

interface PagePayload {
    id: number;
    title?: string | null;
    slug?: string | null;
    excerpt?: string | null;
    status?: string | null;
    featured_image?: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
    seo_keywords?: string | null;
    og_image?: string | null;
    published_at?: string | null;
}

interface Props {
    page: PagePayload;
    blocks: BlockInstance[];
    editorMode?: ContentEditorMode;
    classicContent?: string | null;
}

const formatDateTimeLocal = (value?: string | null) => {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toISOString().slice(0, 16);
};

export default function Edit({
    editorMode = DEFAULT_CONTENT_EDITOR,
    classicContent = '',
    ...props
}: Props) {
    if (editorMode === 'classic_editor') {
        return (
            <ClassicPageEdit
                page={props.page}
                classicContent={classicContent}
            />
        );
    }

    return <BlockPageEdit {...props} />;
}

function BlockPageEdit({ page, blocks }: Omit<Props, 'editorMode' | 'classicContent'>) {
    const [pageBlocks, setPageBlocks] = useState<BlockInstance[]>(blocks ?? []);
    const { data, setData, put, processing, errors } = useForm<PageFormData>({
        title: page.title ?? '',
        slug: page.slug ?? '',
        excerpt: page.excerpt ?? '',
        blocks: '',
        status: page.status ?? 'draft',
        featured_image: page.featured_image ?? '',
        seo_title: page.seo_title ?? '',
        seo_description: page.seo_description ?? '',
        seo_keywords: page.seo_keywords ?? '',
        og_image: page.og_image ?? '',
        published_at: formatDateTimeLocal(page.published_at),
    });

    const isAutosaveEnabled = page.status === 'draft' || page.status === 'auto-draft';
    const { status: autosaveStatus, lastSaved } = useAutoSaveDraft({
        resourceType: 'pages',
        data,
        setData,
        hasContent: () => true,
        isEdit: true,
        initialDraftId: page.id,
        disabled: !isAutosaveEnabled,
    });

    useEffect(() => {
        setData('blocks', JSON.stringify(pageBlocks));
    }, [pageBlocks, setData]);

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        put(update(page.id).url, {
            preserveScroll: true,
            onStart: () => toast.loading('Updating...', { id: 'page' }),
            onSuccess: () => toast.success('Page updated', { id: 'page' }),
            onError: () => toast.error('Validation failed', { id: 'page' }),
        });
    };

    return (
        <>
            <Head title="Edit Page" />

            <form
                onSubmit={submit}
                className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden bg-background"
            >
                <header className="flex shrink-0 flex-col gap-3 border-b bg-background px-4 py-3 xl:flex-row xl:items-center">
                    <Input
                        value={data.title}
                        onChange={(event) =>
                            setData('title', event.target.value)
                        }
                        placeholder="Page title..."
                        className="h-10 text-lg font-semibold xl:max-w-xl"
                    />

                    <div className="flex items-center gap-2 xl:ml-auto">
                        {isAutosaveEnabled && autosaveStatus === 'saving' && (
                            <span className="text-xs text-muted-foreground animate-pulse mr-2">Saving draft...</span>
                        )}
                        {isAutosaveEnabled && autosaveStatus === 'saved' && (
                            <span className="text-xs text-emerald-600 mr-2">Draft saved ({lastSaved})</span>
                        )}
                        {isAutosaveEnabled && autosaveStatus === 'failed' && (
                            <span className="text-xs text-destructive mr-2">Failed to save draft</span>
                        )}

                        <Select
                            value={data.status}
                            onValueChange={(value) => setData('status', value)}
                        >
                            <SelectTrigger className="w-36">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="publish">Publish</SelectItem>
                                <SelectItem value="archived">
                                    Archived
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save'}
                        </Button>
                    </div>

                    {(errors.title || errors.slug || errors.blocks) && (
                        <div className="text-sm text-destructive">
                            {errors.title || errors.slug || errors.blocks}
                        </div>
                    )}
                </header>

                <BlockBuilderWorkspace
                    blocks={pageBlocks}
                    onChange={setPageBlocks}
                    metadataPanel={
                        <PageMetadataPanel
                            slug={data.slug}
                            excerpt={data.excerpt}
                            featuredImage={data.featured_image}
                            ogImage={data.og_image}
                            publishedAt={data.published_at}
                            seoTitle={data.seo_title}
                            seoDescription={data.seo_description}
                            seoKeywords={data.seo_keywords}
                            onSlugChange={(value) => setData('slug', value)}
                            onExcerptChange={(value) =>
                                setData('excerpt', value)
                            }
                            onFeaturedImageChange={(path) =>
                                setData('featured_image', path ?? '')
                            }
                            onOgImageChange={(path) =>
                                setData('og_image', path ?? '')
                            }
                            onPublishedAtChange={(value) =>
                                setData('published_at', value)
                            }
                            onSeoTitleChange={(value) =>
                                setData('seo_title', value)
                            }
                            onSeoDescriptionChange={(value) =>
                                setData('seo_description', value)
                            }
                            onSeoKeywordsChange={(value) =>
                                setData('seo_keywords', value)
                            }
                        />
                    }
                />
            </form>
        </>
    );
}

Edit.layout = (page: React.ReactNode) => (
    <PageEditorLayout
        breadcrumbs={[
            { title: 'Pages', href: '/my-admin/dashboard/pages' },
            { title: 'Edit', href: '/my-admin/dashboard/pages' },
        ]}
    >
        {page}
    </PageEditorLayout>
);
