import Form from './Form';

interface Props {
    urls: {
        index: string;
        store: string;
    };
}

export default function Create({ urls }: Props) {
    return <Form mode="create" urls={urls} />;
}
