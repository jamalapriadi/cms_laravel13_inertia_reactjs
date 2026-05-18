import type { BlockComponent, BlockType } from './block';

import ButtonBlock from './ButtonBlock';
import CodeBlock from './CodeBlock';
import { ColumnBlock } from './ColumnBlock';
import GridBlock from './GridBlock';
import GridItemBlock from './GridItemBlock';
import HeadingBlock from './HeadingBlock';
import ImageBlock from './ImageBlock';
import ListBlock from './ListBlock';
import ParagraphBlock from './ParagraphBlock';
import QuoteBlock from './QuoteBlock';
import { SectionBlock } from './SectionBlock';
import TextBlock from './TextBlock';

/**
 * ✅ Strongly typed registry
 */
export const BLOCK_REGISTRY: Record<BlockType, BlockComponent> = {
    text: TextBlock,
    heading: HeadingBlock,
    paragraph: ParagraphBlock,
    image: ImageBlock,
    list: ListBlock,
    quote: QuoteBlock,
    code: CodeBlock,
    button: ButtonBlock,
    section: SectionBlock,
    column: ColumnBlock,
    grid: GridBlock,
    'grid-item': GridItemBlock,
};
