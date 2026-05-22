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
    text: TextBlock as BlockComponent,
    heading: HeadingBlock as BlockComponent,
    paragraph: ParagraphBlock as BlockComponent,
    image: ImageBlock as BlockComponent,
    list: ListBlock as BlockComponent,
    quote: QuoteBlock as BlockComponent,
    code: CodeBlock as BlockComponent,
    button: ButtonBlock as BlockComponent,
    section: SectionBlock,
    column: ColumnBlock as BlockComponent,
    grid: GridBlock as BlockComponent,
    'grid-item': GridItemBlock as BlockComponent,
};
