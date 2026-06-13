import { Head, Link, router, useForm } from '@inertiajs/react';
import type React from 'react';
import { toast } from 'sonner';

import {
    edit,
    update,
} from '@/actions/App/Http/Controllers/Dashboard/Cms/PageTranslationController';
import { Badge } from '@/components/ui/badge';
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
import Textarea from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

type LanguageOption = {
    id: number;
    code: string;
    name: string | null;
};

type BlockTextItem = {
    path: string;
    original: string;
    translated: string;
};

type PageBlock = {
    id: number;
    parent_id: number | null;
    type: string;
    order: number;
    text_items: BlockTextItem[];
};

type PagePayload = {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    status: string;
    seo_title: string | null;
    seo_description: string | null;
    seo_keywords: string | null;
    published_at: string | null;
};

type PageTranslationPayload = {
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    status: string;
    seo_title: string | null;
    seo_description: string | null;
    seo_keywords: string | null;
    published_at: string | null;
};

type TranslationStatus = {
    id: number;
    code: string;
    name: string | null;
    translated: boolean;
};

interface Props {
    page: PagePayload;
    pageTranslation: PageTranslationPayload;
    language: LanguageOption;
    defaultLanguage: LanguageOption | null;
    languages: LanguageOption[];
    translationStatuses: TranslationStatus[];
    translationExists: boolean;
    blocks: PageBlock[];
}

type FormData = {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    status: string;
    seo_title: string;
    seo_description: string;
    seo_keywords: string;
    published_at: string;
    blocks: Array<{
        block_id: number;
        translations: Record<string, string>;
    }>;
};

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

const looksLikeHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

export default function Edit({
    page,
    pageTranslation,
    language,
    defaultLanguage,
    languages,
    translationStatuses,
    translationExists,
    blocks,
}: Props) {
    const initialBlocks = blocks.map((block) => ({
        block_id: block.id,
        translations: block.text_items.reduce<Record<string, string>>(
            (carry, item) => {
                carry[item.path] = item.translated ?? '';

                return carry;
            },
            {},
        ),
    }));

    const { data, setData, put, processing, errors } = useForm<FormData>({
        title: pageTranslation.title ?? '',
        slug: pageTranslation.slug ?? '',
        excerpt: pageTranslation.excerpt ?? '',
        content: pageTranslation.content ?? '',
        status: pageTranslation.status ?? 'draft',
        seo_title: pageTranslation.seo_title ?? '',
        seo_description: pageTranslation.seo_description ?? '',
        seo_keywords: pageTranslation.seo_keywords ?? '',
        published_at: formatDateTimeLocal(pageTranslation.published_at),
        blocks: initialBlocks,
    });

    const updateBlockTranslation = (
        blockId: number,
        path: string,
        value: string,
    ) => {
        setData(
            'blocks',
            data.blocks.map((blockData) => {
                if (blockData.block_id !== blockId) {
                    return blockData;
                }

                return {
                    ...blockData,
                    translations: {
                        ...blockData.translations,
                        [path]: value,
                    },
                };
            }),
        );
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        put(
            update({
                page: page.id,
                language: language.id,
            }).url,
            {
                preserveScroll: true,
                onStart: () =>
                    toast.loading('Saving translation...', {
                        id: 'save-page-translation',
                    }),
                onSuccess: () =>
                    toast.success('Translation saved successfully.', {
                        id: 'save-page-translation',
                    }),
                onError: () =>
                    toast.error('Failed to save translation.', {
                        id: 'save-page-translation',
                    }),
            },
        );
    };

    return (
        <>
            <Head title={`Translate Page: ${page.title}`} />

            <div className="container mx-auto max-w-7xl space-y-6 px-6 py-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Page Translation
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Translate page fields and detected block text.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="outline">
                            Target: {language.code.toUpperCase()}
                        </Badge>
                        <Badge
                            variant={translationExists ? 'default' : 'secondary'}
                        >
                            {translationExists ? 'Translated' : 'Draft'}
                        </Badge>
                        {defaultLanguage && (
                            <Badge variant="secondary">
                                Default: {defaultLanguage.code.toUpperCase()}
                            </Badge>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Language Selector</CardTitle>
                        <CardDescription>
                            Switch translation target language for this page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Select
                            value={String(language.id)}
                            onValueChange={(value) =>
                                router.visit(
                                    edit({
                                        page: page.id,
                                        language: Number(value),
                                    }).url,
                                )
                            }
                        >
                            <SelectTrigger className="w-full md:w-72">
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map((item) => (
                                    <SelectItem
                                        key={item.id}
                                        value={String(item.id)}
                                    >
                                        {item.code.toUpperCase()} - {item.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex flex-wrap gap-2">
                            {translationStatuses.map((item) => (
                                <Badge
                                    key={item.id}
                                    variant={
                                        item.translated
                                            ? 'default'
                                            : 'outline'
                                    }
                                >
                                    {item.code.toUpperCase()}:{' '}
                                    {item.translated ? 'done' : 'empty'}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Page Fields</CardTitle>
                            <CardDescription>
                                Original fields stay read-only while translated
                                fields are editable.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <Field label="Original Title">
                                    <Input value={page.title} readOnly />
                                </Field>
                                <Field
                                    label="Translated Title"
                                    error={errors.title}
                                >
                                    <Input
                                        value={data.title}
                                        onChange={(event) =>
                                            setData('title', event.target.value)
                                        }
                                    />
                                </Field>

                                <Field label="Original Slug">
                                    <Input value={page.slug} readOnly />
                                </Field>
                                <Field
                                    label="Translated Slug"
                                    error={errors.slug}
                                >
                                    <Input
                                        value={data.slug}
                                        onChange={(event) =>
                                            setData('slug', event.target.value)
                                        }
                                    />
                                </Field>

                                <Field label="Original Excerpt">
                                    <Textarea
                                        value={page.excerpt ?? ''}
                                        readOnly
                                        rows={4}
                                    />
                                </Field>
                                <Field
                                    label="Translated Excerpt"
                                    error={errors.excerpt}
                                >
                                    <Textarea
                                        value={data.excerpt}
                                        onChange={(event) =>
                                            setData(
                                                'excerpt',
                                                event.target.value,
                                            )
                                        }
                                        rows={4}
                                    />
                                </Field>

                                <Field
                                    label="Translated Content"
                                    error={errors.content}
                                    className="md:col-span-2"
                                >
                                    <Textarea
                                        value={data.content}
                                        onChange={(event) =>
                                            setData(
                                                'content',
                                                event.target.value,
                                            )
                                        }
                                        rows={8}
                                    />
                                </Field>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <Field label="Status" error={errors.status}>
                                    <Select
                                        value={data.status}
                                        onValueChange={(value) =>
                                            setData('status', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Status" />
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
                                </Field>

                                <Field
                                    label="Published At"
                                    error={errors.published_at}
                                >
                                    <Input
                                        type="datetime-local"
                                        value={data.published_at}
                                        onChange={(event) =>
                                            setData(
                                                'published_at',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>SEO Translation</CardTitle>
                            <CardDescription>
                                Optional localized SEO metadata for this page.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <Field label="SEO Title" error={errors.seo_title}>
                                <Input
                                    value={data.seo_title}
                                    onChange={(event) =>
                                        setData(
                                            'seo_title',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="SEO Description"
                                error={errors.seo_description}
                            >
                                <Textarea
                                    value={data.seo_description}
                                    onChange={(event) =>
                                        setData(
                                            'seo_description',
                                            event.target.value,
                                        )
                                    }
                                    rows={4}
                                />
                            </Field>
                            <Field
                                label="SEO Keywords"
                                error={errors.seo_keywords}
                                className="md:col-span-2"
                            >
                                <Textarea
                                    value={data.seo_keywords}
                                    onChange={(event) =>
                                        setData(
                                            'seo_keywords',
                                            event.target.value,
                                        )
                                    }
                                    rows={3}
                                />
                            </Field>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Block Translations</CardTitle>
                            <CardDescription>
                                Translate only text detected from block props.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {blocks.length === 0 && (
                                <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                                    No blocks found for this page.
                                </div>
                            )}

                            {blocks.map((block, blockIndex) => (
                                <div
                                    key={block.id}
                                    className="space-y-4 rounded-xl border p-4"
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="outline">
                                            Block #{block.id}
                                        </Badge>
                                        <Badge variant="secondary">
                                            {block.type}
                                        </Badge>
                                    </div>

                                    {block.text_items.length === 0 ? (
                                        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                                            This block has no translatable text.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {block.text_items.map((item) => {
                                                const currentValue =
                                                    data.blocks.find(
                                                        (entry) =>
                                                            entry.block_id ===
                                                            block.id,
                                                    )?.translations[item.path] ??
                                                    '';
                                                const useRichEditor =
                                                    block.type ===
                                                        'rich-editor' ||
                                                    looksLikeHtml(
                                                        item.original,
                                                    ) ||
                                                    looksLikeHtml(currentValue);

                                                return (
                                                    <div
                                                        key={`${block.id}-${item.path}`}
                                                        className="grid gap-4 md:grid-cols-2"
                                                    >
                                                        <Field label={item.path}>
                                                            {useRichEditor ? (
                                                                <div className="min-h-24 rounded-md border border-input bg-muted/20 p-3 text-sm [&_p]:mb-2 [&_p:last-child]:mb-0">
                                                                    <div
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: item.original,
                                                                        }}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <Textarea
                                                                    value={
                                                                        item.original
                                                                    }
                                                                    readOnly
                                                                    rows={3}
                                                                />
                                                            )}
                                                        </Field>
                                                        <Field
                                                            label={`Translation (${item.path})`}
                                                            error={
                                                                errors[
                                                                    `blocks.${blockIndex}.translations.${item.path}` as keyof typeof errors
                                                                ] as
                                                                    | string
                                                                    | undefined
                                                            }
                                                        >
                                                            {useRichEditor ? (
                                                                <TinyEditor
                                                                    value={
                                                                        currentValue
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) =>
                                                                        updateBlockTranslation(
                                                                            block.id,
                                                                            item.path,
                                                                            value,
                                                                        )
                                                                    }
                                                                    height={220}
                                                                />
                                                            ) : (
                                                                <Textarea
                                                                    value={
                                                                        currentValue
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateBlockTranslation(
                                                                            block.id,
                                                                            item.path,
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    rows={3}
                                                                />
                                                            )}
                                                        </Field>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Link href="/my-admin/dashboard/pages">
                            <Button type="button" variant="outline">
                                Back
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Translation'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

function Field({
    label,
    error,
    className = '',
    children,
}: {
    label: string;
    error?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={`space-y-2 ${className}`}>
            <Label>{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

Edit.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Pages', href: '/my-admin/dashboard/pages' },
            { title: 'Translations', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
