import AccordionBlock from './AccordionBlock';
import type { BlockComponent, BlockType } from './block';
import ButtonBlock from './ButtonBlock';
import CardBlock from './CardBlock';
import CodeBlock from './CodeBlock';
import { ColumnBlock } from './ColumnBlock';
import ColumnsBlock from './ColumnsBlock';
import ContainerBlock from './ContainerBlock';
import DividerBlock from './DividerBlock';
import FlexColumnBlock from './FlexColumnBlock';
import FlexRowBlock from './FlexRowBlock';
import GridBlock from './GridBlock';
import GridItemBlock from './GridItemBlock';
import HeadingBlock from './HeadingBlock';
import IconBlock from './IconBlock';
import ImageBlock from './ImageBlock';
import ListBlock from './ListBlock';
import ParagraphBlock from './ParagraphBlock';
import QuoteBlock from './QuoteBlock';
import RichEditorBlock from './RichEditorBlock';
import { SectionBlock } from './SectionBlock';
import SliderBlock from './SliderBlock';
import SpacerBlock from './SpacerBlock';
import TableBlock from './TableBlock';
import TabsBlock from './TabsBlock';
import TextBlock from './TextBlock';

/**
 * ✅ Strongly typed registry
 */
export const BLOCK_REGISTRY: Record<BlockType, BlockComponent> = {
    text: TextBlock as BlockComponent,
    heading: HeadingBlock as BlockComponent,
    paragraph: ParagraphBlock as BlockComponent,
    'rich-editor': RichEditorBlock as BlockComponent,
    image: ImageBlock as BlockComponent,
    list: ListBlock as BlockComponent,
    quote: QuoteBlock as BlockComponent,
    code: CodeBlock as BlockComponent,
    button: ButtonBlock as BlockComponent,
    icon: IconBlock as BlockComponent,
    divider: DividerBlock as BlockComponent,
    spacer: SpacerBlock as BlockComponent,
    table: TableBlock as BlockComponent,
    section: SectionBlock,
    container: ContainerBlock as BlockComponent,
    column: ColumnBlock as BlockComponent,
    columns: ColumnsBlock as BlockComponent,
    'flex-row': FlexRowBlock as BlockComponent,
    'flex-column': FlexColumnBlock as BlockComponent,
    card: CardBlock as BlockComponent,
    tabs: TabsBlock as BlockComponent,
    accordion: AccordionBlock as BlockComponent,
    slider: SliderBlock as BlockComponent,
    grid: GridBlock as BlockComponent,
    'grid-item': GridItemBlock as BlockComponent,
};
