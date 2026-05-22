// types/block.ts

export type BlockType =
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
    | 'grid-item'
    | 'text'
    | 'paragraph'
    | 'rich-editor'
    | 'heading'
    | 'image'
    | 'button'
    | 'icon'
    | 'divider'
    | 'spacer'
    | 'list'
    | 'quote'
    | 'code';

/**
 * Base Block
 */
export interface BlockInstance<T = any> {
    id: number;
    type: BlockType;
    data: T;
    styles?: Record<string, string>;
    children?: BlockInstance[];
}
