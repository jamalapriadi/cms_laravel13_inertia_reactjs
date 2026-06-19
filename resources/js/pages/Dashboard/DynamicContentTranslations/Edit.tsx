import { Head, Link, router, useForm } from '@inertiajs/react';
import type React from 'react';
import { toast } from 'sonner';

import DynamicFieldInput from '@/components/dynamic-content/DynamicFieldInput';
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
import Textarea from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type {
    DynamicContentFieldFormValue,
    DynamicContentType,
    DynamicFieldGroup,
} from '@/types/dynamic-content';

type LanguageOption = {
    id: number;
    code: string;
    name: string | null;
};

type TranslationStatus = {
    id: number;
    code: string;
    name: string | null;
    translated: boolean;
};

type ContentEntryPayload = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    status: string;
    published_at: string | null;
    data: Record<string, any>;
};

type ContentTranslationPayload = {
    title: string;
    slug: string;
    excerpt: string | null;
    status: string;
    published_at: string | null;
    data: Record<string, any>;
};

interface Props {
    contentType: DynamicContentType;
    contentEntry: ContentEntryPayload;
    translation: ContentTranslationPayload;
    language: LanguageOption;
    defaultLanguage: LanguageOption | null;
    languages: LanguageOption[];
    translationStatuses: TranslationStatus[];
    translationExists: boolean;
    fieldGroups: DynamicFieldGroup[];
}

type FormData = {
    title: string;
    slug: string;
    excerpt: string;
    status: string;
    published_at: string;
    data: Record<string, any>;
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

export default function Edit({
    contentType,
    contentEntry,
    translation,
    language,
    defaultLanguage,
    languages,
    translationStatuses,
    translationExists,
    fieldGroups,
}: Props) {
    const { data, setData, put, processing, errors } = useForm<FormData>({
        title: translation.title ?? '',
        slug: translation.slug ?? '',
        excerpt: translation.excerpt ?? '',
        status: translation.status ?? 'draft',
        published_at: formatDateTimeLocal(translation.published_at),
        data: translation.data ?? {},
    });

    const setFieldValue = (
        name: string,
        value: DynamicContentFieldFormValue,
    ) => {
        setData('data', {
            ...data.data,
            [name]: value,
        });
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        const url = `/my-admin/dashboard/content/${contentType.slug}/${contentEntry.id}/translations/${language.id}`;

        put(url, {
            preserveScroll: true,
            onStart: () =>
                toast.loading('Saving translation...', {
                    id: 'save-translation',
                }),
            onSuccess: () =>
                toast.success('Translation saved successfully.', {
                    id: 'save-translation',
                }),
            onError: () =>
                toast.error('Failed to save translation.', {
                    id: 'save-translation',
                }),
        });
    };

    return (
        <>
            <Head title={`Translate: ${contentEntry.title}`} />

            <div className="container mx-auto max-w-7xl space-y-6 px-6 py-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Translation: {contentType.name}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Translate content entry fields for specific locales.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="outline">
                            Target: {language.code.toUpperCase()}
                        </Badge>
                        <Badge
                            variant={
                                translationExists ? 'default' : 'secondary'
                            }
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
                            Switch translation target language for this entry.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Select
                            value={String(language.id)}
                            onValueChange={(value) => {
                                const url = `/my-admin/dashboard/content/${contentType.slug}/${contentEntry.id}/translations/${value}`;
                                router.visit(url);
                            }}
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
                                        item.translated ? 'default' : 'outline'
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
                            <CardTitle>Core Fields</CardTitle>
                            <CardDescription>
                                Left side shows original fields, right side is
                                translation input.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Original Title</Label>
                                    <Input value={contentEntry.title} readOnly />
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
                                    <Input value={contentEntry.slug} readOnly />
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

                                <div className="space-y-2">
                                    <Label>Original Excerpt</Label>
                                    <Textarea value={contentEntry.excerpt ?? ''} readOnly rows={4} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Translated Excerpt</Label>
                                    <Textarea
                                        value={data.excerpt}
                                        onChange={(event) =>
                                            setData('excerpt', event.target.value)
                                        }
                                        rows={4}
                                    />
                                    <FieldError message={errors.excerpt} />
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2 pt-6 border-t">
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
                                            <SelectItem value="published">
                                                Published
                                            </SelectItem>
                                            <SelectItem value="archived">
                                                Archived
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

                    {fieldGroups.map((group) => (
                        <Card key={group.id}>
                            <CardHeader>
                                <CardTitle>{group.name} Translations</CardTitle>
                                {group.description && (
                                    <CardDescription>
                                        {group.description}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {group.fields.length === 0 && (
                                    <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                                        No fields in this group.
                                    </div>
                                )}

                                <div className="space-y-8">
                                    {group.fields.map((field) => (
                                        <div
                                            key={field.id}
                                            className="grid gap-6 md:grid-cols-2 rounded-xl border p-4"
                                        >
                                            {/* Original Field (Read Only Visual) */}
                                            <div className="space-y-2 opacity-70 pointer-events-none">
                                                <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <Badge variant="outline" className="scale-75 origin-left">ORIGINAL</Badge>
                                                    {field.label} ({field.name})
                                                </Label>
                                                <DynamicFieldInput
                                                    field={field}
                                                    value={field.value}
                                                    onChange={() => {}}
                                                />
                                            </div>

                                            {/* Translated Field Input */}
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <Badge className="scale-75 origin-left">TRANSLATION</Badge>
                                                    {field.label}
                                                </Label>
                                                <DynamicFieldInput
                                                    field={field}
                                                    value={data.data[field.name]}
                                                    error={
                                                        errors[
                                                            `data.${field.name}` as keyof typeof errors
                                                        ] as string | undefined
                                                    }
                                                    onChange={(value) =>
                                                        setFieldValue(
                                                            field.name,
                                                            value as DynamicContentFieldFormValue,
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <div className="flex justify-end gap-3 pb-8">
                        <Link href={`/my-admin/dashboard/content/${contentType.slug}`}>
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
            { title: 'Dynamic Content', href: '#' },
            { title: 'Translations', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
