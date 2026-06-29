import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type React from 'react';
import { toast } from 'sonner';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';

import { store } from '@/actions/App/Http/Controllers/Dashboard/PageController';
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
import { generateSlug, shouldAutoSyncSlug } from '@/utils/slug';
import ClassicPageEditor from './components/ClassicPageEditor';
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

interface Props {
    editorMode?: ContentEditorMode;
    latestDraft?: {
        id: number;
        title: string;
        updated_at: string;
    } | null;
}

export default function Create({
    editorMode = DEFAULT_CONTENT_EDITOR,
    latestDraft = null,
}: Props) {
    return editorMode === 'classic_editor' ? (
        <ClassicPageEditor latestDraft={latestDraft} />
    ) : (
        <BlockPageCreate latestDraft={latestDraft} />
    );
}

function BlockPageCreate({ latestDraft = null }: { latestDraft?: Props['latestDraft'] }) {
    const [pageBlocks, setPageBlocks] = useState<BlockInstance[]>([]);
    const [showDraftBanner, setShowDraftBanner] = useState(!!latestDraft);

    const { data, setData, post, put, processing, errors } = useForm<PageFormData>({
        title: '',
        slug: '',
        excerpt: '',
        blocks: '',
        status: 'draft',
        featured_image: '',
        seo_title: '',
        seo_description: '',
        seo_keywords: '',
        og_image: '',
        published_at: '',
    });

    const { status: autosaveStatus, lastSaved, draftId } = useAutoSaveDraft({
        resourceType: 'pages',
        data,
        setData,
        hasContent: (d) => d.title.trim() !== '' || d.excerpt.trim() !== '' || (d.blocks && d.blocks !== '[]' && d.blocks !== ''),
        isEdit: false,
    });

    useEffect(() => {
        setData('blocks', JSON.stringify(pageBlocks));
    }, [pageBlocks, setData]);

    const updateTitle = (title: string) => {
        const shouldSyncSlug = shouldAutoSyncSlug(data.slug, data.title);

        setData({
            ...data,
            title,
            slug: shouldSyncSlug ? generateSlug(title) : data.slug,
        });
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        const currentId = draftId || latestDraft?.id;

        if (currentId) {
            put(`/my-admin/dashboard/pages/${currentId}`, {
                preserveScroll: true,
                onStart: () => toast.loading('Saving...', { id: 'page' }),
                onSuccess: () => toast.success('Page saved successfully', { id: 'page' }),
                onError: () => toast.error('Validation failed', { id: 'page' }),
            });
        } else {
            post(store().url, {
                preserveScroll: true,
                onStart: () => toast.loading('Saving...', { id: 'page' }),
                onSuccess: () => toast.success('Page created', { id: 'page' }),
                onError: () => toast.error('Validation failed', { id: 'page' }),
            });
        }
    };

    return (
        <>
            <Head title="Create Page" />

            {latestDraft && showDraftBanner && (
                <div className="flex items-center justify-between bg-yellow-50 border-b border-yellow-200 px-6 py-2.5 text-sm text-yellow-800 shrink-0">
                    <span>
                        You have an unsaved draft ("{latestDraft.title || 'Untitled'}") from {latestDraft.updated_at}.
                    </span>
                    <div className="flex gap-2">
                        <Link href={`/my-admin/dashboard/pages/${latestDraft.id}/edit`}>
                            <Button size="sm" variant="outline" type="button" className="border-yellow-300 text-yellow-800 hover:bg-yellow-100">
                                Continue editing
                            </Button>
                        </Link>
                        <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            className="text-yellow-800 hover:bg-yellow-100"
                            onClick={() => setShowDraftBanner(false)}
                        >
                            Dismiss
                        </Button>
                    </div>
                </div>
            )}

            <form
                onSubmit={submit}
                className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden bg-background"
            >
                <header className="flex shrink-0 flex-col gap-3 border-b bg-background px-4 py-3 xl:flex-row xl:items-center">
                    <Input
                        value={data.title}
                        onChange={(event) => updateTitle(event.target.value)}
                        placeholder="Page title..."
                        className="h-10 text-lg font-semibold xl:max-w-xl"
                    />

                    <div className="flex items-center gap-2 xl:ml-auto">
                        {autosaveStatus === 'saving' && (
                            <span className="text-xs text-muted-foreground animate-pulse mr-2">Saving draft...</span>
                        )}
                        {autosaveStatus === 'saved' && (
                            <span className="text-xs text-emerald-600 mr-2">Draft saved ({lastSaved})</span>
                        )}
                        {autosaveStatus === 'failed' && (
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

Create.layout = (page: React.ReactNode) => (
    <PageEditorLayout
        breadcrumbs={[
            { title: 'Pages', href: '/my-admin/dashboard/pages' },
            { title: 'Create', href: '/my-admin/dashboard/pages/create' },
        ]}
    >
        {page}
    </PageEditorLayout>
);
