import type { DynamicContentType } from '@/types/dynamic-content';
import GroupForm from './GroupForm';

interface Props {
    contentTypes: DynamicContentType[];
    urls: {
        index: string;
        store: string;
    };
}

export default function Create({ contentTypes, urls }: Props) {
    return <GroupForm mode="create" contentTypes={contentTypes} urls={urls} />;
}
