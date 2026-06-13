import type {
    DynamicContentEntry,
    DynamicContentFormData,
    DynamicContentType,
    DynamicFieldGroup,
} from '@/types/dynamic-content';
import Form from './Form';

interface Props {
    contentType: DynamicContentType;
    contentEntry: DynamicContentEntry;
    fieldGroups: DynamicFieldGroup[];
    form: DynamicContentFormData;
    statusOptions: string[];
    urls: Record<string, string>;
    mediaLibrary: {
        index: string;
        store: string;
    };
}

export default function Edit(props: Props) {
    return <Form mode="edit" {...props} />;
}
