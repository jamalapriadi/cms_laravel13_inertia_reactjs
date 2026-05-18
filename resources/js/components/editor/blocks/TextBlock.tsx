// components/editor/blocks/TextBlock.tsx

import type { BlockComponent } from '../types/block';

type TextData = {
    text: string;
};

const TextBlock: BlockComponent<TextData> = {
    type: 'text',

    create: () => ({
        text: 'New text...',
    }),

    render: ({ data }) => {
        return (
            <p className="text-sm leading-relaxed">
                {data.text || 'Empty text...'}
            </p>
        );
    },

    editor: ({ data, onChange }) => {
        return (
            <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Text</label>

                <textarea
                    className="textarea w-full border"
                    value={data.text || ''}
                    onChange={(e) => onChange({ text: e.target.value })}
                    placeholder="Write your text..."
                    rows={4}
                />
            </div>
        );
    },
};

export default TextBlock;
