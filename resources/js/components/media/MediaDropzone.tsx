import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { router } from '@inertiajs/react';

export default function MediaDropzone() {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        acceptedFiles.forEach((file) => {
            router.post(
                '/my-admin/dashboard/media',
                {
                    file,
                },
                {
                    forceFormData: true,
                    preserveScroll: true,
                },
            );
        });
    }, []);

    const { getRootProps, getInputProps } = useDropzone({ onDrop });

    return (
        <div
            {...getRootProps()}
            className="flex flex-1 items-center justify-center border-2 border-dashed border-border"
        >
            <input {...getInputProps()} />
            <p className="text-muted-foreground">
                Drag & drop files here, or click to upload
            </p>
        </div>
    );
}
