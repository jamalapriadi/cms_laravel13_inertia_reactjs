import { store } from '@/actions/Jamalapriadi/DynamicContentBuilder/Http/Controllers/Dashboard/DynamicContentEntryController';
import type {
    DynamicContentFormData,
    DynamicContentType,
    DynamicFieldGroup,
} from '@/types/dynamic-content';
import Form from './Form';

interface Props {
    contentType: DynamicContentType;
    fieldGroups: DynamicFieldGroup[];
    form: DynamicContentFormData;
}

export default function Create({ contentType, fieldGroups, form }: Props) {
    return (
        <Form
            mode="create"
            contentType={contentType}
            fieldGroups={fieldGroups}
            form={form}
            submitUrl={store({ contentType: contentType.slug }).url}
        />
    );
}
