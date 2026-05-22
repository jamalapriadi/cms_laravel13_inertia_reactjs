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
    | 'column'
    | 'grid'
    | 'grid-item';

export interface BlockInstance<T = any> {
    id: number;
    type: BlockType;
    data: T;
    styles?: Record<string, string>;
    children?: BlockInstance[];
}

export interface BlockComponent<T = any> {
    type: BlockType;

    create: () => T;

    render: (props: {
        data: T;
        styles?: Record<string, string>;
        children?: React.ReactNode;
    }) => React.ReactNode;

    editor?: (props: {
        data: T;
        onChange: (val: Partial<T>) => void;
    }) => React.ReactNode;
}
