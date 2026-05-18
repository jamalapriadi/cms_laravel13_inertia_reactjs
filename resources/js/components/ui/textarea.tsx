import * as React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: string;
}

const Textarea = React.forwardRef<
    HTMLTextAreaElement,
    TextareaProps
>(({ className, error, ...props }, ref) => {
    return (
        <div className="space-y-1">
            <textarea
                ref={ref}
                className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition',
                    'focus:ring-2 focus:ring-primary',
                    error && 'border-destructive focus:ring-destructive',
                    className
                )}
                {...props}
            />

            {error && (
                <p className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
});

Textarea.displayName = 'Textarea';

export default Textarea;