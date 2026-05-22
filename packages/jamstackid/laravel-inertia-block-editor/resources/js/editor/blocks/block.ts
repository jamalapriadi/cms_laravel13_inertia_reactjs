export type BlockType =
    | 'text'
    | 'heading'
    | 'paragraph'
    | 'rich-editor'
    | 'image'
    | 'list'
    | 'quote'
    | 'code'
    | 'button'
    | 'icon'
    | 'divider'
    | 'spacer'
    | 'section'
    | 'container'
    | 'column'
    | 'columns'
    | 'flex-row'
    | 'flex-column'
    | 'card'
    | 'tabs'
    | 'accordion'
    | 'slider'
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
