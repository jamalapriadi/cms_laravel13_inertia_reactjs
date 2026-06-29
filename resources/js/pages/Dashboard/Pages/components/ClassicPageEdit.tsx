import { Head, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import type React from 'react';
import { toast } from 'sonner';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';

import { update } from '@/actions/App/Http/Controllers/Dashboard/PageController';
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

export default function ClassicPageEdit({
    page,
    classicContent = '',
}: Props) {
    const { data, setData, put, processing, errors } = useForm<PageFormData>({
        title: page.title ?? '',
        slug: page.slug ?? '',
        excerpt: page.excerpt ?? '',
        blocks: '[]',
        status: page.status ?? 'draft',
        featured_image: page.featured_image ?? '',
        seo_title: page.seo_title ?? '',
        seo_description: page.seo_description ?? '',
        seo_keywords: page.seo_keywords ?? '',
        og_image: page.og_image ?? '',
        published_at: formatDateTimeLocal(page.published_at),
        classic_content: classicContent,
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
        setData(
            'blocks',
            JSON.stringify(buildClassicEditorBlocks(data.classic_content)),
        );
    }, [data.classic_content, setData]);

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

                <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
                    <main className="min-h-0 overflow-y-auto bg-muted/20 p-4">
                        <div className="w-full">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Classic Editor</CardTitle>
                                    <CardDescription>
                                        Edit page content with the existing rich
                                        text editor while keeping the stored
                                        data compatible with the block renderer.
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
