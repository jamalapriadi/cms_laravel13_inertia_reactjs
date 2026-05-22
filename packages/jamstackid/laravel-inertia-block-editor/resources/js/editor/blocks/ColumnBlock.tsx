const DEFAULT_WIDTH = '100%';

const ALLOWED_WIDTHS = ['100%', '75%', '66%', '50%', '33%', '25%'];

export const ColumnBlock = {
    type: 'column',

    create: () => ({
        width: DEFAULT_WIDTH,
    }),

    render: ({ data, children }: any) => {
        const width = ALLOWED_WIDTHS.includes(data?.width)
            ? data.width
            : DEFAULT_WIDTH;

        const hasChildren = children && children.length > 0;

        return (
            <div
                style={{ width }}
                className="relative min-h-20 rounded border border-dashed p-3 transition hover:border-primary/50"
            >
                {hasChildren ? (
                    <div className="space-y-2">{children}</div>
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-xs text-muted-foreground">
                            Drop content here
                        </p>
                    </div>
                )}
            </div>
        );
    },

    editor: ({ data, onChange }: any) => {
        const width = data?.width ?? DEFAULT_WIDTH;

        return (
            <div className="space-y-3">
                {/* WIDTH PRESET */}
                <div>
                    <label className="text-xs text-muted-foreground">
                        Width
                    </label>

                    <select
                        className="w-full rounded border p-2"
                        value={width}
                        onChange={(e) => onChange({ width: e.target.value })}
                    >
                        {ALLOWED_WIDTHS.map((w) => (
                            <option key={w} value={w}>
                                {w}
                            </option>
                        ))}
                    </select>
                </div>

                {/* CUSTOM WIDTH */}
                <div>
                    <label className="text-xs text-muted-foreground">
                        Custom Width (optional)
                    </label>

                    <input
                        className="w-full rounded border p-2"
                        placeholder="e.g. 40% or 300px"
                        value={width}
                        onChange={(e) => onChange({ width: e.target.value })}
                    />
                </div>
            </div>
        );
    },
};
