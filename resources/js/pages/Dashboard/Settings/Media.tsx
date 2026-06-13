import { Head, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { OptionItem } from '@/types/option';

interface Props {
    options: OptionItem[];
}

interface MimeType {
    key: string;
    value: boolean;
}

interface MediaFormData {
    thumbnail_size_w: string;
    thumbnail_size_h: string;
    medium_size_w: string;
    medium_size_h: string;
    large_size_w: string;
    large_size_h: string;
    max_upload_file: string;
    upload_mimetype: MimeType[];
}

type SizeField =
    | 'thumbnail_size_w'
    | 'thumbnail_size_h'
    | 'medium_size_w'
    | 'medium_size_h'
    | 'large_size_w'
    | 'large_size_h';

export default function Media({ options }: Props) {
    const [initialized, setInitialized] = useState(false);
    const [newMime, setNewMime] = useState('');
    const [showMimeInput, setShowMimeInput] = useState(false);

    const DEFAULT_MIME_TYPES: MimeType[] = [
        { key: 'video/mp4', value: false },
        { key: 'image/png', value: false },
        { key: 'image/jpeg', value: false },
        { key: 'image/webp', value: false },
        { key: 'application/pdf', value: false },
    ];

    const { data, setData, post, processing } = useForm<MediaFormData>({
        thumbnail_size_w: '',
        thumbnail_size_h: '',
        medium_size_w: '',
        medium_size_h: '',
        large_size_w: '',
        large_size_h: '',
        max_upload_file: '',
        upload_mimetype: [],
    });

    const sizeSections: Array<{ title: string; w: SizeField; h: SizeField }> = [
        {
            title: 'Thumbnail Size',
            w: 'thumbnail_size_w',
            h: 'thumbnail_size_h',
        },
        {
            title: 'Medium Size',
            w: 'medium_size_w',
            h: 'medium_size_h',
        },
        {
            title: 'Large Size',
            w: 'large_size_w',
            h: 'large_size_h',
        },
    ];

    /**
     * ✅ Mapping options → form state
     */
    useEffect(() => {
        if (!options || initialized) {
            return;
        }

        const mapped: any = {};
        let dbMimeTypes: MimeType[] = [];

        options.forEach((item) => {
            if (item.key === 'upload_mimetype') {
                try {
                    dbMimeTypes =
                        typeof item.value === 'string'
                            ? JSON.parse(item.value)
                            : (item.value ?? []);
                } catch {
                    dbMimeTypes = [];
                }
            } else if (item.key in data) {
                mapped[item.key] = item.value ?? '';
            }
        });

        /**
         * ✅ Merge default + DB
         */
        const mergedMimeTypes: MimeType[] = [
            ...DEFAULT_MIME_TYPES.map((def) => {
                const exists = dbMimeTypes.find((m) => m.key === def.key);

                return exists ? exists : def;
            }),
            ...dbMimeTypes.filter(
                (m) => !DEFAULT_MIME_TYPES.some((d) => d.key === m.key),
            ),
        ];

        setData((prev) => ({
            ...prev,
            ...mapped,
            upload_mimetype: mergedMimeTypes,
        }));

        setInitialized(true);
    }, [options, initialized]);

    /**
     * ✅ Submit
     */
    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/my-admin/dashboard/options', {
            preserveScroll: true,
            onStart: () => toast.loading('Saving...', { id: 'save' }),
            onSuccess: () =>
                toast.success('Media settings updated', { id: 'save' }),
            onError: () => toast.error('Failed to save', { id: 'save' }),
        });
    };

    /**
     * ✅ Toggle Mime
     */
    const toggleMime = (key: string) => {
        setData(
            'upload_mimetype',
            data.upload_mimetype.map((m) =>
                m.key === key ? { ...m, value: !m.value } : m,
            ),
        );
    };

    /**
     * ✅ Add Mime
     */
    const addNewMime = () => {
        const formatted = newMime.trim().toLowerCase();

        if (!formatted) {
            toast.error('Mime type cannot be empty');

            return;
        }

        if (data.upload_mimetype.some((m) => m.key === formatted)) {
            toast.error('Mime type already exists');

            return;
        }

        setData('upload_mimetype', [
            ...data.upload_mimetype,
            { key: formatted, value: true },
        ]);

        setNewMime('');
        setShowMimeInput(false);
    };

    const deleteMime = (key: string) => {
        setData(
            'upload_mimetype',
            data.upload_mimetype.filter((m) => m.key !== key),
        );
    };

    if (!initialized) {
        return null;
    }

    return (
        <>
            <Head title="Media Settings" />

            <div className="container mx-auto px-6 py-6">
                <div className="container mx-auto space-y-10 px-6 py-10">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold">Media Settings</h1>
                        <p className="text-muted-foreground">
                            Configure image sizes and upload settings.
                        </p>
                    </div>

                    <hr />

                    <form onSubmit={submit} className="space-y-12">
                        {/* Image Sizes */}
                        {sizeSections.map((section) => (
                            <section
                                key={section.title}
                                className="grid grid-cols-3 gap-8"
                            >
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        {section.title}
                                    </h3>
                                </div>

                                <div className="col-span-2 space-y-4 rounded-xl bg-card p-6 shadow">
                                    <Input
                                        type="number"
                                        placeholder="Width"
                                        value={data[section.w]}
                                        onChange={(e) =>
                                            setData(section.w, e.target.value)
                                        }
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Height"
                                        value={data[section.h]}
                                        onChange={(e) =>
                                            setData(section.h, e.target.value)
                                        }
                                    />
                                </div>
                            </section>
                        ))}

                        {/* Max Upload */}
                        <section className="grid grid-cols-3 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    Max Upload File
                                </h3>
                            </div>

                            <div className="col-span-2 rounded-xl bg-card p-6 shadow">
                                <Input
                                    type="number"
                                    value={data.max_upload_file}
                                    onChange={(e) =>
                                        setData(
                                            'max_upload_file',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </section>

                        {/* Mime Types */}
                        <section className="grid grid-cols-3 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    Allowed Mime Types
                                </h3>
                            </div>

                            <div className="col-span-2 space-y-6 rounded-xl bg-card p-6 shadow">
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowMimeInput(!showMimeInput)
                                        }
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        + Add Mime
                                    </button>
                                </div>

                                {showMimeInput && (
                                    <div className="flex gap-2">
                                        <Input
                                            value={newMime}
                                            onChange={(e) =>
                                                setNewMime(e.target.value)
                                            }
                                        />
                                        <Button
                                            type="button"
                                            onClick={addNewMime}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    {data.upload_mimetype.map((mime) => (
                                        <div
                                            key={mime.key}
                                            className="flex items-center justify-between rounded-lg border px-4 py-2"
                                        >
                                            <span className="text-sm">
                                                {mime.key}
                                            </span>

                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={mime.value}
                                                    onCheckedChange={() =>
                                                        toggleMime(mime.key)
                                                    }
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        deleteMime(mime.key)
                                                    }
                                                    className="text-xs text-red-500 hover:underline"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Submit */}
                        <div className="flex justify-end">
                            <Button disabled={processing}>
                                {processing ? 'Saving...' : 'Update Settings'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

/**
 * ✅ Layout (CONSISTENT)
 */
Media.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan',
            href: '/my-admin/dashboard/config/main',
        },
        {
            title: 'Media',
            href: '/my-admin/dashboard/config/media',
        },
    ],
};
