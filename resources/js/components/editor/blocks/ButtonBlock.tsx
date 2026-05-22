/**
 * ✅ TYPES
 */
interface ButtonData {
    text: string;
    url: string;
}

interface BlockRenderProps<T> {
    data: T;
}

interface BlockEditorProps<T> {
    data: T;
    onChange: (data: Partial<T>) => void;
}

/**
 * ✅ BUTTON BLOCK
 */
const ButtonBlock = {
    type: 'button',

    /**
     * 🏗 CREATE DEFAULT DATA
     */
    create(): ButtonData {
        return {
            text: 'Click me',
            url: '#',
        };
    },

    /**
     * 🎨 RENDER (FRONT / PREVIEW)
     */
    render({ data }: BlockRenderProps<ButtonData>) {
        return (
            <a
                href={data.url || '#'}
                className="inline-block rounded bg-primary px-4 py-2 text-white transition hover:opacity-90"
            >
                {data.text || 'Button'}
            </a>
        );
    },

    /**
     * ⚙️ EDITOR (RIGHT PANEL)
     */
    editor({ data, onChange }: BlockEditorProps<ButtonData>) {
        return (
            <div className="space-y-3">
                <div>
                    <label className="text-xs text-muted-foreground">
                        Text
                    </label>
                    <input
                        type="text"
                        className="w-full rounded border px-2 py-1 text-sm"
                        placeholder="Button text..."
                        value={data.text || ''}
                        onChange={(e) => onChange({ text: e.target.value })}
                    />
                </div>

                <div>
                    <label className="text-xs text-muted-foreground">URL</label>
                    <input
                        type="text"
                        className="w-full rounded border px-2 py-1 text-sm"
                        placeholder="https://..."
                        value={data.url || ''}
                        onChange={(e) => onChange({ url: e.target.value })}
                    />
                </div>
            </div>
        );
    },
};

export default ButtonBlock;
