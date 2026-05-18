import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { router } from '@inertiajs/react';

export default function MediaDropzone() {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        acceptedFiles.forEach((file) => {
            router.post(
                '/dashboard/media',
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
            className="flex flex-1 items-center justify-center border-2 border-dashed border-gray-300"
        >
            <input {...getInputProps()} />
            <p className="text-gray-500">
                Drag & drop files here, or click to upload
            </p>
        </div>
    );
}
