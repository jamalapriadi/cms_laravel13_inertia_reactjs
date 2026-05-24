import { Head, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import MediaLibraryUploadModal from '@/components/media/MediaLibraryUploadModal';
import type { MediaLibraryItem } from '@/components/media/MediaLibraryUploadModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MonacoEditor from '@/components/ui/MonacoEditor';
import Textarea from '@/components/ui/textarea';

import type { OptionItem } from '@/types/option';

interface Props {
    options: OptionItem[];
}

const preferenceFields = [
    'site_title',
    'meta_keyword',
    'meta_description',
    'robot_txt',
    'code_snippet_head',
    'code_snippet_body',
    'code_snippet_footer',
    'email_recipient',
    'social_sharing_image',
] as const;

export default function Preferences({ options }: Props) {
    const [initialized, setInitialized] = useState(false);
    const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
    const [mediaItems, setMediaItems] = useState<MediaLibraryItem[]>([]);
    const [currentMediaPath, setCurrentMediaPath] = useState('');
    const [isMediaLoading, setIsMediaLoading] = useState(false);

    const { data, setData, post, processing } = useForm({
        site_title: '',
        meta_keyword: '',
        meta_description: '',
        robot_txt: '',
        code_snippet_head: '',
        code_snippet_body: '',
        code_snippet_footer: '',
        email_recipient: '',
        social_sharing_image: '',
    });

    /**
     * ✅ Mapping options → state (clean & safe)
     */
    useEffect(() => {
        if (!options || initialized) {
            return;
        }

        const mapped: Record<string, string> = {};

        for (const item of options) {
            if (
                preferenceFields.includes(
                    item.key as (typeof preferenceFields)[number],
                )
            ) {
                mapped[item.key] = item.value ?? '';
            }

        }

        setData((prev) => ({ ...prev, ...mapped }));
        setInitialized(true);
    }, [options, initialized, setData]);

    const loadMediaLibrary = async (path = '') => {
        setIsMediaLoading(true);

        try {
            const response = await fetch(
                `/dashboard/media/library?path=${encodeURIComponent(path)}`,
            );
            const result = await response.json();

            setMediaItems(result.storageItems ?? []);
            setCurrentMediaPath(result.currentPath ?? path);
        } finally {
            setIsMediaLoading(false);
        }
    };

    const openMediaLibrary = () => {
        setIsMediaLibraryOpen(true);
        loadMediaLibrary(currentMediaPath);
    };

    const selectSocialSharingImage = (item: MediaLibraryItem) => {
        setData('social_sharing_image', item.path);
        setIsMediaLibraryOpen(false);
    };

    const resolveAssetUrl = (url: string) => {
        if (!url) {
            return 'https://www.clipartmax.com/png/middle/293-2939065_apps-home-icon-website-logo-png-transparent-background.png';
        }

        if (
            url.startsWith('http://') ||
            url.startsWith('https://') ||
            url.startsWith('/')
        ) {
            return url;
        }

        return `/storage/${url}`;
    };

    /**
     * ✅ Submit
     */
    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/dashboard/options', {
            preserveScroll: true,
            onStart: () => toast.loading('Saving...', { id: 'save' }),
            onSuccess: () =>
                toast.success('Preferences updated', { id: 'save' }),
            onError: () => toast.error('Failed to save', { id: 'save' }),
        });
    };

    if (!initialized) {
        return null;
    }

    return (
        <>
            <Head title="Preferences" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">Preferences</h1>
                    <p className="text-muted-foreground">
                        Configure SEO, snippets and social settings
                    </p>
                </div>

                <hr />

                <form onSubmit={submit} className="space-y-12">
                    {/* SEO */}
                    <section className="grid grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold">
                                Title & Meta
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Define how your website appears in search
                                engines.
                            </p>
                        </div>

                        <div className="col-span-2 space-y-6 rounded-xl bg-card p-6 shadow">
                            <div>
                                <label>Meta Keyword</label>
                                <Textarea
                                    value={data.meta_keyword}
                                    onChange={(e) =>
                                        setData('meta_keyword', e.target.value)
                                    }
                                />
                            </div>

                            <div>
                                <label>Meta Description</label>
                                <Textarea
                                    value={data.meta_description}
                                    onChange={(e) =>
                                        setData(
                                            'meta_description',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </section>

                    <hr />

                    {/* CODE */}
                    <section className="grid grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold">
                                Robots & Snippets
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Custom robots.txt and script snippets.
                            </p>
                        </div>

                        <div className="col-span-2 space-y-6 rounded-xl bg-card p-6 shadow">
                            <EditorField
                                label="Robots.txt"
                                value={data.robot_txt}
                                onChange={(val) => setData('robot_txt', val)}
                                language="plaintext"
                            />

                            <EditorField
                                label="Snippet Head"
                                value={data.code_snippet_head}
                                onChange={(val) =>
                                    setData('code_snippet_head', val)
                                }
                                language="html"
                            />

                            <EditorField
                                label="Snippet Body"
                                value={data.code_snippet_body}
                                onChange={(val) =>
                                    setData('code_snippet_body', val)
                                }
                                language="html"
                            />

                            <EditorField
                                label="Snippet Footer"
                                value={data.code_snippet_footer}
                                onChange={(val) =>
                                    setData('code_snippet_footer', val)
                                }
                                language="html"
                            />

                            <div>
                                <label>Email Recipient</label>
                                <Input
                                    type="email"
                                    value={data.email_recipient}
                                    onChange={(e) =>
                                        setData(
                                            'email_recipient',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </section>

                    <hr />

                    <section className="grid grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold">
                                Social Sharing Image
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                When you share a link to your website on social
                                media, this image will be used if no other
                                relevant image is found.
                            </p>
                        </div>

                        <div className="col-span-2">
                            <div className="rounded-xl bg-card shadow">
                                {/* CARD HEADER */}
                                <div className="flex items-center justify-between border-b px-6 py-4">
                                    <h4 className="font-semibold">
                                        Social sharing image preview
                                    </h4>

                                    <button
                                        type="button"
                                        onClick={openMediaLibrary}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        Change image
                                    </button>
                                </div>

                                {/* CARD BODY */}
                                <div className="space-y-4 p-6">
                                    <p className="text-sm">
                                        Image{' '}
                                        <span className="text-muted-foreground">
                                            (Recommended size: 1200 x 628 px)
                                        </span>
                                    </p>

                                    {/* Preview Card */}
                                    <div className="rounded-lg border p-4">
                                        <div className="flex gap-4">
                                            {/* IMAGE */}
                                            <div className="w-32">
                                                <img
                                                    src={resolveAssetUrl(
                                                        data.social_sharing_image,
                                                    )}
                                                    alt="Preview"
                                                    className="h-24 w-full rounded object-cover"
                                                />
                                            </div>

                                            {/* TEXT */}
                                            <div className="flex flex-col justify-center">
                                                <h4 className="text-sm font-semibold text-foreground">
                                                    {data.site_title ||
                                                        'Your page title will appear here'}
                                                </h4>

                                                <p className="text-xs text-muted-foreground">
                                                    {window.location.origin}
                                                </p>

                                                <p className="line-clamp-2 text-xs text-muted-foreground">
                                                    {data.meta_description ||
                                                        'Your meta description will appear here when you start typing.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SUBMIT */}
                    <div className="flex justify-end">
                        <Button disabled={processing}>
                            {processing ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>

            <MediaLibraryUploadModal
                isOpen={isMediaLibraryOpen}
                onClose={() => setIsMediaLibraryOpen(false)}
                items={mediaItems}
                currentPath={currentMediaPath}
                loading={isMediaLoading}
                onOpenFolder={loadMediaLibrary}
                onSelectFile={selectSocialSharingImage}
                onUploaded={(item) => {
                    setMediaItems((currentItems) => [item, ...currentItems]);
                    selectSocialSharingImage(item);
                }}
                autoSelectUploaded
            />
        </>
    );
}

/**
 * ✅ Reusable Monaco Field (cleaner)
 */
function EditorField({
    label,
    value,
    onChange,
    language = 'html',
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    language?: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label>{label}</label>
            <MonacoEditor
                value={value || ''}
                onChange={onChange}
                language={language}
            />
        </div>
    );
}

/**
 * ✅ Layout (konsisten dengan General)
 */
Preferences.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan',
            href: '/dashboard/config/main',
        },
        {
            title: 'Preferences',
            href: '/dashboard/config/preferences',
        },
    ],
};
