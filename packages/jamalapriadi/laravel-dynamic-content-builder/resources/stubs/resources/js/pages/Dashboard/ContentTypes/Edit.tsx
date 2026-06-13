import type { DynamicContentType } from '@/types/dynamic-content';
import Form from './Form';

interface Props {
    contentType: DynamicContentType;
    urls: {
        index: string;
        update: string;
        destroy: string;
    };
}

export default function Edit({ contentType, urls }: Props) {
    return <Form mode="edit" contentType={contentType} urls={urls} />;
}
