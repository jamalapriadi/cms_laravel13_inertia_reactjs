import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Toaster, toast } from 'sonner';

interface Flash {
    success?: string;
    error?: string;
}

export default function NotificationProvider() {
    const { flash, errors } = usePage().props as any;

    useEffect(() => {
        // Success message
        if (flash?.success) {
            toast.success(flash.success);
        }

        // Error message
        if (flash?.error) {
            toast.error(flash.error);
        }

        // Validation errors
        if (errors && Object.keys(errors).length > 0) {
            Object.values(errors).forEach((error: any) => {
                toast.error(error[0]);
            });
        }
    }, [flash, errors]);

    return (
        <Toaster position="top-right" richColors closeButton duration={4000} />
    );
}
