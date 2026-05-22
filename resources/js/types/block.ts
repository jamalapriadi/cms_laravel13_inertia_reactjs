// types/block.ts

export type BlockType =
    | 'section'
    | 'column'
    | 'grid'
    | 'grid-item'
    | 'text'
    | 'paragraph'
    | 'heading'
    | 'image'
    | 'button'
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
