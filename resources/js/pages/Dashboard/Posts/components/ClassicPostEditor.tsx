import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type React from 'react';
import { toast } from 'sonner';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';

import { store } from '@/actions/App/Http/Controllers/Dashboard/PostController';
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
import PostMetadataPanel from './PostMetadataPanel';

type TaxonomyOption = {
    id: number;
    term?: {
        name?: string | null;
    } | null;
};

type CategoryOption = {
    id: string;
    category_name?: string | null;
};

type PostFormData = {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    status: string;
    category_id: string;
    tag_names: string[];
    featured_image: string;
    published_at: string;
    classic_content: string;
};

interface Props {
    categories?: CategoryOption[];
    tags?: TaxonomyOption[];
    latestDraft?: {
        id: number;
        title: string;
        updated_at: string;
    } | null;
}

export default function ClassicPostEditor({
    categories = [],
    tags = [],
    latestDraft = null,
}: Props) {
    const [showDraftBanner, setShowDraftBanner] = useState(!!latestDraft);

    const { data, setData, post, put, processing, errors } = useForm<PostFormData>({
        title: '',
        slug: '',
        excerpt: '',
        content: '[]',
        status: 'draft',
        category_id: '',
        tag_names: [],
        featured_image: '',
        published_at: '',
        classic_content: '',
    });

    const { status: autosaveStatus, lastSaved, draftId } = useAutoSaveDraft({
        resourceType: 'posts',
        data,
        setData,
        hasContent: (d) => d.title.trim() !== '' || d.excerpt.trim() !== '' || d.classic_content.trim() !== '',
        isEdit: false,
    });

    useEffect(() => {
        setData(
            'content',
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
            put(`/my-admin/dashboard/posts/${currentId}`, {
                preserveScroll: true,
                onStart: () => toast.loading('Saving...', { id: 'post' }),
                onSuccess: () => toast.success('Post saved successfully', { id: 'post' }),
                onError: () => toast.error('Validation failed', { id: 'post' }),
            });
        } else {
            post(store().url, {
                preserveScroll: true,
                onStart: () => toast.loading('Saving...', { id: 'post' }),
                onSuccess: () => toast.success('Post created', { id: 'post' }),
                onError: () => toast.error('Validation failed', { id: 'post' }),
            });
        }
    };

    return (
        <>
            <Head title="Create Post" />

            {latestDraft && showDraftBanner && (
                <div className="flex items-center justify-between bg-yellow-50 border-b border-yellow-200 px-6 py-2.5 text-sm text-yellow-800 shrink-0">
                    <span>
                        You have an unsaved draft ("{latestDraft.title || 'Untitled'}") from {latestDraft.updated_at}.
                    </span>
                    <div className="flex gap-2">
                        <Link href={`/my-admin/dashboard/posts/${latestDraft.id}/edit`}>
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
                        placeholder="Post title..."
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
                            </SelectContent>
                        </Select>

                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save'}
                        </Button>
                    </div>

                    {(errors.title || errors.slug || errors.content) && (
                        <div className="text-sm text-destructive">
                            {errors.title || errors.slug || errors.content}
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
                                        Write the post content in a familiar
                                        article editor. The content will still
                                        be stored in the CMS block-compatible
                                        format.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="post-content">
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
                                        <InputError message={errors.content} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </main>

                    <aside className="min-h-0 overflow-y-auto border-t bg-background p-4 xl:border-t-0 xl:border-l">
                        <PostMetadataPanel
                            slug={data.slug}
                            excerpt={data.excerpt}
                            categories={categories}
                            tags={tags}
                            selectedCategoryId={data.category_id}
                            selectedTagNames={data.tag_names}
                            featuredImage={data.featured_image}
                            publishedAt={data.published_at}
                            errors={{
                                slug: errors.slug,
                                excerpt: errors.excerpt,
                            }}
                            onSlugChange={(value) => setData('slug', value)}
                            onExcerptChange={(value) =>
                                setData('excerpt', value)
                            }
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
        </>
    );
}
