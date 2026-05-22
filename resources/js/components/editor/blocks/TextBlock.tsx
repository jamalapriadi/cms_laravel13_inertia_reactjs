// components/editor/blocks/TextBlock.tsx

import TinyEditor from '@/components/ui/TinyEditor';
import type { BlockComponent } from './block';
import { buildBlockStyle } from '../style';

type TextData = {
    html: string;
    text?: string;
};

const TextBlock: BlockComponent<TextData> = {
    type: 'text',

    create: () => ({
        html: '<p>Write your article content...</p>',
    }),

    render: ({ data, styles }) => {
        return (
            <div
                className="prose-sm dark:prose-invert prose max-w-none leading-relaxed"
                style={buildBlockStyle(styles)}
                dangerouslySetInnerHTML={{
                    __html: data.html || data.text || '<p>Empty text...</p>',
                }}
            />
        );
    },

    editor: ({ data, onChange }) => {
        return (
            <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Text</label>

                <TinyEditor
                    value={data.html || data.text || ''}
                    onChange={(html) => onChange({ html })}
                    height={320}
                />
            </div>
        );
    },
};

export default TextBlock;
