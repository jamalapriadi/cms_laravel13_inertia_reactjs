export type BlockType =
    | 'text'
    | 'heading'
    | 'paragraph'
    | 'image'
    | 'list'
    | 'quote'
    | 'code'
    | 'button'
    | 'section'
    | 'column';

export interface BlockInstance<T = any> {
    id: number;
    type: BlockType;
    data: T;
    children?: BlockInstance[];
}

export interface BlockComponent<T = any> {
    type: BlockType;

    create: () => T;

    render: (props: { data: T; children?: React.ReactNode }) => React.ReactNode;

    editor?: (props: {
        data: T;
        onChange: (val: Partial<T>) => void;
    }) => React.ReactNode;
}
