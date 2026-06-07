import { Head, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type React from 'react';
import { toast } from 'sonner';

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

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export default function Create() {
    const [pageBlocks, setPageBlocks] = useState<BlockInstance[]>([]);
    const { data, setData, post, processing, errors } = useForm<PageFormData>({
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

    useEffect(() => {
        setData('blocks', JSON.stringify(pageBlocks));
    }, [pageBlocks, setData]);

    const updateTitle = (title: string) => {
        setData('title', title);

        if (!data.slug) {
            setData('slug', slugify(title));
        }
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        post(store().url, {
            preserveScroll: true,
            onStart: () => toast.loading('Saving...', { id: 'page' }),
            onSuccess: () => toast.success('Page created', { id: 'page' }),
            onError: () => toast.error('Validation failed', { id: 'page' }),
        });
    };

    return (
        <>
            <Head title="Create Page" />

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
            { title: 'Pages', href: '/dashboard/pages' },
            { title: 'Create', href: '/dashboard/pages/create' },
        ]}
    >
        {page}
    </PageEditorLayout>
);
