const ALLOWED_LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

export default {
    type: 'heading',

    create: () => ({
        text: 'Heading...',
        level: 'h2',
    }),

    render: ({ data }: any) => {
        const level = ALLOWED_LEVELS.includes(data?.level) ? data.level : 'h2';

        const Tag = level as React.ElementType;

        const text = data?.text ?? '';

        const sizeMap: Record<string, string> = {
            h1: 'text-3xl font-bold',
            h2: 'text-2xl font-semibold',
            h3: 'text-xl font-semibold',
            h4: 'text-lg font-medium',
            h5: 'text-base font-medium',
            h6: 'text-sm font-medium',
        };

        return (
            <Tag className={sizeMap[level]}>{text || 'Untitled Heading'}</Tag>
        );
    },

    editor: ({ data, onChange }: any) => {
        return (
            <div className="space-y-3">
                {/* TEXT */}
                <div>
                    <label className="text-xs text-muted-foreground">
                        Text
                    </label>
                    <input
                        className="w-full rounded border p-2"
                        value={data?.text ?? ''}
                        onChange={(e) => onChange({ text: e.target.value })}
                        placeholder="Write heading..."
                    />
                </div>

                {/* LEVEL */}
                <div>
                    <label className="text-xs text-muted-foreground">
                        Level
                    </label>
                    <select
                        className="w-full rounded border p-2"
                        value={data?.level ?? 'h2'}
                        onChange={(e) => onChange({ level: e.target.value })}
                    >
                        {ALLOWED_LEVELS.map((lvl) => (
                            <option key={lvl} value={lvl}>
                                {lvl.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        );
    },
};
