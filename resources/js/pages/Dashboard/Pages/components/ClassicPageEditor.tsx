import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type React from 'react';
import { toast } from 'sonner';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';

import { store } from '@/actions/App/Http/Controllers/Dashboard/PageController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import TinyEditor from '@/components/ui/TinyEditor';
import { buildClassicEditorBlocks } from '@/utils/content-editor';
import { generateSlug, shouldAutoSyncSlug } from '@/utils/slug';
import PageMetadataPanel from './PageMetadataPanel';

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
    classic_content: string;
};

export default function ClassicPageEditor({ latestDraft = null }: { latestDraft?: any }) {
    const [showDraftBanner, setShowDraftBanner] = useState(!!latestDraft);

    const { data, setData, post, put, processing, errors } = useForm<PageFormData>({
        title: '',
        slug: '',
        excerpt: '',
        blocks: '[]',
        status: 'draft',
        featured_image: '',
        seo_title: '',
        seo_description: '',
        seo_keywords: '',
        og_image: '',
        published_at: '',
        classic_content: '',
    });

    const { status: autosaveStatus, lastSaved, draftId } = useAutoSaveDraft({
        resourceType: 'pages',
        data,
        setData,
        hasContent: (d) => d.title.trim() !== '' || d.excerpt.trim() !== '' || d.classic_content.trim() !== '',
        isEdit: false,
    });

    useEffect(() => {
        setData(
            'blocks',
            JSON.stringify(buildClassicEditorBlocks(data.classic_content)),
        );
    }, [data.classic_content, setData]);

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

                <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
                    <main className="min-h-0 overflow-y-auto bg-muted/20 p-4">
                        <div className="w-full">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Classic Editor</CardTitle>
                                    <CardDescription>
                                        Write the page content with the existing
                                        rich text editor while keeping the saved
                                        data compatible with the CMS block
                                        renderer.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="page-content">
                                            Content
                                        </Label>
                                        <TinyEditor
                                            value={data.classic_content}
                                            onChange={(value) =>
                                                setData(
                                                    'classic_content',
                                                    value,
                                                )
                                            }
                                            height={560}
                                        />
                                        <InputError message={errors.blocks} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </main>

                    <aside className="min-h-0 overflow-y-auto border-t bg-background p-4 xl:border-t-0 xl:border-l">
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
                    </aside>
                </div>
            </form>
        </>
    );
}
