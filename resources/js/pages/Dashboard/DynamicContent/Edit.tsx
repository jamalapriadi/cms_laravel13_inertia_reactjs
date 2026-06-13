import { update } from '@/actions/App/Http/Controllers/Dashboard/DynamicContentEntryController';
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
}

export default function Edit({
    contentType,
    contentEntry,
    fieldGroups,
    form,
}: Props) {
    return (
        <Form
            mode="edit"
            contentType={contentType}
            fieldGroups={fieldGroups}
            form={form}
            submitUrl={update({
                contentType: contentType.slug,
                contentEntry: contentEntry.id,
            }).url}
        />
    );
}
