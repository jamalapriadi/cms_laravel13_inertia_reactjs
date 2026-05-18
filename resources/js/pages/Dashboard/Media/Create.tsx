import { Head, router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { Button } from '@/components/ui/button';

export default function CreateMedia() {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles((prev) => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
    });

    const handleUpload = async () => {
        if (!files.length) {
            return;
        }

        setUploading(true);

        let completed = 0;

        files.forEach((file) => {
            router.post(
                '/dashboard/media',
                { file },
                {
                    forceFormData: true,
                    preserveScroll: true,
                    onFinish: () => {
                        completed++;

                        if (completed === files.length) {
                            setUploading(false);
                            setFiles([]);
                        }
                    },
                },
            );
        });
    };

    return (
        <>
            <Head title="Upload Media" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">Upload Media</h1>
                    <p className="text-gray-500">
                        Upload images or files to your media library
                    </p>
                </div>

                <hr />

                {/* DROPZONE */}
                <div
                    {...getRootProps()}
                    className={`flex h-72 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition ${
                        isDragActive
                            ? 'border-primary bg-primary/10'
                            : 'border-muted bg-muted/30'
                    }`}
                >
                    <input {...getInputProps()} />

                    <div className="text-center">
                        <p className="text-lg font-semibold">
                            Drag & drop files here
                        </p>
                        <p className="text-sm text-muted-foreground">
                            or click to select files
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Max size: 10MB
                        </p>
                    </div>
                </div>

                {/* PREVIEW */}
                {files.length > 0 && (
                    <section className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold">
                                Selected Files
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Preview before uploading
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="rounded-xl border bg-white p-2 shadow-sm"
                                >
                                    <img
                                        src={URL.createObjectURL(file)}
                                        className="h-28 w-full rounded object-cover"
                                    />
                                    <p className="mt-2 truncate text-xs">
                                        {file.name}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={handleUpload} disabled={uploading}>
                                {uploading ? 'Uploading...' : 'Upload Files'}
                            </Button>
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}

/**
 * ✅ CONSISTENT LAYOUT
 */
CreateMedia.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Media', href: '/dashboard/media' },
        { title: 'Upload', href: '/dashboard/media/create' },
    ],
};

// Index.layout = {
//     breadcrumbs: [
//         { title: 'Dashboard', href: '/dashboard' },
//         { title: 'Media Library', href: '/dashboard/media' },
//     ],
// };
