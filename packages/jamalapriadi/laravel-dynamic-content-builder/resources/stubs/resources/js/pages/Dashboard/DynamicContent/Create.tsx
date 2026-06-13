import type { DynamicContentFormData, DynamicContentType, DynamicFieldGroup } from '@/types/dynamic-content';
import Form from './Form';

interface Props {
    contentType: DynamicContentType;
    fieldGroups: DynamicFieldGroup[];
    form: DynamicContentFormData;
    statusOptions: string[];
    urls: Record<string, string>;
    mediaLibrary: {
        index: string;
        store: string;
    };
}

export default function Create(props: Props) {
    return <Form mode="create" {...props} />;
}
