import { Head } from '@inertiajs/react';

import type { DynamicContentType } from '@/types/dynamic-content';
import GroupForm from './GroupForm';

interface Props {
    contentTypes: DynamicContentType[];
}

export default function Create({ contentTypes }: Props) {
    return (
        <>
            <Head title="Create Field Group" />

            <div className="container mx-auto max-w-5xl space-y-8 px-6 py-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Create Field Group
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Create a reusable custom field group and assign it to a
                        content type.
                    </p>
                </div>

                <GroupForm mode="create" contentTypes={contentTypes} />
            </div>
        </>
    );
}
