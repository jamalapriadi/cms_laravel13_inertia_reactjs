import { Head, Link, router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';

import { edit, update } from '@/actions/App/Http/Controllers/Dashboard/Cms/PostTranslationController';
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

type PostBlock = {
    id: number;
    parent_id: number | null;
    type: string;
    order: number;
    text_items: BlockTextItem[];
};

type PostPayload = {
    id: number;
    title: string;
    slug: string;
    content: string | null;
    status: string;
    published_at: string | null;
};

type PostTranslationPayload = {
    title: string;
    slug: string;
    content: string | null;
    status: string;
    published_at: string | null;
};

type TranslationStatus = {
    id: number;
    code: string;
    name: string | null;
    translated: boolean;
};

interface Props {
    post: PostPayload;
    postTranslation: PostTranslationPayload;
    language: LanguageOption;
    defaultLanguage: LanguageOption | null;
    languages: LanguageOption[];
    translationStatuses: TranslationStatus[];
    translationExists: boolean;
    blocks: PostBlock[];
}

type FormData = {
    title: string;
    slug: string;
    content: string;
    status: string;
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
    post,
    postTranslation,
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
        title: postTranslation.title ?? '',
        slug: postTranslation.slug ?? '',
        content: postTranslation.content ?? '',
        status: postTranslation.status ?? 'draft',
        published_at: formatDateTimeLocal(postTranslation.published_at),
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
                post: post.id,
                language: language.id,
            }).url,
            {
                preserveScroll: true,
                onStart: () =>
                    toast.loading('Saving translation...', { id: 'save-translation' }),
                onSuccess: () =>
                    toast.success('Translation saved successfully.', {
                        id: 'save-translation',
                    }),
                onError: () =>
                    toast.error('Failed to save translation.', {
                        id: 'save-translation',
                    }),
            },
        );
    };

    return (
        <>
            <Head title={`Translate Post: ${post.title}`} />

            <div className="container mx-auto max-w-7xl space-y-6 px-6 py-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Post Translation
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Translate post content and block texts without changing original blocks.
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
                    <CardHeader className="space-y-3">
                        <CardTitle>Language Selector</CardTitle>
                        <CardDescription>
                            Switch translation target language for this post.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Select
                            value={String(language.id)}
                            onValueChange={(value) =>
                                router.visit(
                                    edit({
                                        post: post.id,
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
                            <CardTitle>Post Fields</CardTitle>
                            <CardDescription>
                                Left side shows original fields, right side is translation input.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Original Title</Label>
                                    <Input value={post.title} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Translated Title</Label>
                                    <Input
                                        value={data.title}
                                        onChange={(event) =>
                                            setData('title', event.target.value)
                                        }
                                    />
                                    <FieldError message={errors.title} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Original Slug</Label>
                                    <Input value={post.slug} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Translated Slug</Label>
                                    <Input
                                        value={data.slug}
                                        onChange={(event) =>
                                            setData('slug', event.target.value)
                                        }
                                    />
                                    <FieldError message={errors.slug} />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label>Translated Content</Label>
                                    <Textarea
                                        value={data.content}
                                        onChange={(event) =>
                                            setData('content', event.target.value)
                                        }
                                        rows={8}
                                    />
                                    <FieldError message={errors.content} />
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Status</Label>
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
                                    <FieldError message={errors.status} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Published At</Label>
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
                                    <FieldError message={errors.published_at} />
                                </div>
                            </div>
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
                                    No blocks found for this post.
                                </div>
                            )}

                            {blocks.map((block, blockIndex) => (
                                <div key={block.id} className="space-y-4 rounded-xl border p-4">
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
                                                    looksLikeHtml(
                                                        currentValue,
                                                    );

                                                return (
                                                    <div
                                                        key={`${block.id}-${item.path}`}
                                                        className="grid gap-4 md:grid-cols-2"
                                                    >
                                                        <div className="space-y-2">
                                                            <Label className="text-xs text-muted-foreground">
                                                                {item.path}
                                                            </Label>
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
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs text-muted-foreground">
                                                                Translation ({item.path})
                                                            </Label>
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
                                                                    height={
                                                                        220
                                                                    }
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
                                                        </div>
                                                        <FieldError
                                                            message={
                                                                errors[
                                                                    `blocks.${blockIndex}.translations.${item.path}` as keyof typeof errors
                                                                ] as
                                                                    | string
                                                                    | undefined
                                                            }
                                                        />
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
                        <Link href="/my-admin/dashboard/posts">
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

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-xs text-destructive">{message}</p>;
}

Edit.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Posts', href: '/my-admin/dashboard/posts' },
            { title: 'Translations', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
