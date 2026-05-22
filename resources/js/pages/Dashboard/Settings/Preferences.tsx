import { Head, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MonacoEditor from '@/components/ui/MonacoEditor';
import Textarea from '@/components/ui/textarea';

import type { OptionItem } from '@/types/option';

interface Props {
    options: OptionItem[];
}

export default function Preferences({ options }: Props) {
    const fileRef = useRef<HTMLInputElement | null>(null);
    const [initialized, setInitialized] = useState(false);
    const [preview, setPreview] = useState('');

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

        const mapped: Partial<typeof data> = {};

        for (const item of options) {
            if (item.key in data) {
                mapped[item.key as keyof typeof data] = item.value ?? '';
            }

            if (item.key === 'social_sharing_image') {
                setPreview(item.value ?? '');
            }
        }

        setData((prev) => ({ ...prev, ...mapped }));
        setInitialized(true);
    }, [options, initialized, setData]);

    /**
     * ✅ Upload Image (fetch version)
     */
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) {
            return;
        }

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            toast.loading('Uploading...', { id: 'upload' });

            const res = await fetch('/dashboard/media/json', {
                method: 'POST',
                body: formData,
            });

            const result = await res.json();

            setData('social_sharing_image', result.location);
            setPreview(result.location);

            toast.success('Uploaded successfully', { id: 'upload' });
        } catch (err) {
            toast.error('Upload failed' + err, { id: 'upload' });
        } finally {
            e.target.value = '';
        }
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

                                    <div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            ref={fileRef}
                                            className="hidden"
                                            onChange={handleUpload}
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                fileRef.current?.click()
                                            }
                                            className="text-sm text-blue-600 hover:underline"
                                        >
                                            Change image
                                        </button>
                                    </div>
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
                                                    src={
                                                        data.social_sharing_image ||
                                                        'https://www.clipartmax.com/png/middle/293-2939065_apps-home-icon-website-logo-png-transparent-background.png'
                                                    }
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
