import { Head, Link, useForm } from '@inertiajs/react';
import { PenSquare } from 'lucide-react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';

import { store as storeOptions } from '@/actions/App/Http/Controllers/Dashboard/OptionController';
import { index as configIndex } from '@/actions/App/Http/Controllers/Dashboard/SettingController';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DEFAULT_CONTENT_EDITOR } from '@/utils/content-editor';
import type { ContentEditorMode } from '@/utils/content-editor';

interface Props {
    defaultContentEditor?: ContentEditorMode;
}

const editorOptions: Array<{
    value: ContentEditorMode;
    title: string;
    description: string;
}> = [
    {
        value: 'classic_editor',
        title: 'Classic Editor',
        description:
            'Start new posts and pages with a traditional writing form and the existing rich text editor.',
    },
    {
        value: 'block_editor',
        title: 'Block Editor',
        description:
            'Keep the current full block builder experience for new posts and pages.',
    },
];

export default function Writing({
    defaultContentEditor = DEFAULT_CONTENT_EDITOR,
}: Props) {
    const { data, setData, post, processing } = useForm<{
        default_content_editor: ContentEditorMode;
    }>({
        default_content_editor: defaultContentEditor,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        post(storeOptions().url, {
            preserveScroll: true,
            onStart: () => toast.loading('Saving...', { id: 'writing-settings' }),
            onSuccess: () =>
                toast.success('Writing settings updated', {
                    id: 'writing-settings',
                }),
            onError: () =>
                toast.error('Failed to update writing settings', {
                    id: 'writing-settings',
                }),
        });
    };

    return (
        <>
            <Head title="Writing Settings" />

            <div className="container mx-auto max-w-5xl px-6 py-10">
                <div className="space-y-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                                <PenSquare className="size-3.5" />
                                Content workflow
                            </div>
                            <div>
                                <h1 className="text-3xl font-semibold tracking-tight">
                                    Writing Settings
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                    Choose the default editor used when admins
                                    create new posts and pages. Existing content
                                    stays compatible with the current CMS
                                    renderer.
                                </p>
                            </div>
                        </div>

                        <Button variant="outline" asChild>
                            <Link href={configIndex().url}>
                                Back to Settings
                            </Link>
                        </Button>
                    </div>

                    <form onSubmit={submit}>
                        <Card className="overflow-hidden">
                            <CardHeader className="border-b bg-muted/30">
                                <CardTitle>Default content editor</CardTitle>
                                <CardDescription>
                                    This setting affects
                                    {' '}
                                    <code>/my-admin/dashboard/posts/create</code>
                                    {' '}
                                    and
                                    {' '}
                                    <code>/my-admin/dashboard/pages/create</code>
                                    .
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6 pt-6">
                                <div className="grid gap-4">
                                    {editorOptions.map((option) => {
                                        const checked =
                                            data.default_content_editor ===
                                            option.value;

                                        return (
                                            <Label
                                                key={option.value}
                                                className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
                                                    checked
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-border hover:bg-muted/40'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="default_content_editor"
                                                    value={option.value}
                                                    checked={checked}
                                                    onChange={() =>
                                                        setData(
                                                            'default_content_editor',
                                                            option.value,
                                                        )
                                                    }
                                                    className="mt-1 h-4 w-4 accent-primary"
                                                />

                                                <div className="space-y-1">
                                                    <div className="font-medium">
                                                        {option.title}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {option.description}
                                                    </p>
                                                </div>
                                            </Label>
                                        );
                                    })}
                                </div>

                                <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                                    Posts and pages created with the classic
                                    editor are still saved in a block-compatible
                                    format, so the existing API and rendering
                                    flow remain intact.
                                </div>

                                <div className="flex justify-end">
                                    <Button type="submit" disabled={processing}>
                                        {processing
                                            ? 'Saving...'
                                            : 'Save settings'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>
            </div>
        </>
    );
}
