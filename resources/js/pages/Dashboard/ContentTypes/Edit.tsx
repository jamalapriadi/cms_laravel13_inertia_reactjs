import type { DynamicContentType } from '@/types/dynamic-content';
import Form from './Form';

interface Props {
    contentType: DynamicContentType;
}

export default function Edit({ contentType }: Props) {
    return <Form mode="edit" contentType={contentType} />;
}
