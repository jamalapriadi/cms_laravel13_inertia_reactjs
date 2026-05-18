const DEFAULT_COL_SPAN = 1;
const DEFAULT_ROW_SPAN = 1;

const ALLOWED_SPAN = [1, 2, 3, 4, 5, 6];

export default {
    type: 'grid-item',

    create: () => ({
        colSpan: DEFAULT_COL_SPAN,
        rowSpan: DEFAULT_ROW_SPAN,
    }),

    render: ({ data, children }: any) => {
        const colSpan = ALLOWED_SPAN.includes(data?.colSpan)
            ? data.colSpan
            : DEFAULT_COL_SPAN;

        const rowSpan = ALLOWED_SPAN.includes(data?.rowSpan)
            ? data.rowSpan
            : DEFAULT_ROW_SPAN;

        const hasChildren = children && children.length > 0;

        return (
            <div
                style={{
                    gridColumn: `span ${colSpan} / span ${colSpan}`,
                    gridRow: `span ${rowSpan} / span ${rowSpan}`,
                }}
                className="relative min-h-20 rounded border border-dashed p-3 transition hover:border-primary/50"
            >
                {hasChildren ? (
                    children
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-xs text-muted-foreground">
                            Grid Item
                        </p>
                    </div>
                )}
            </div>
        );
    },

    editor: ({ data, onChange }: any) => {
        const colSpan = data?.colSpan ?? DEFAULT_COL_SPAN;
        const rowSpan = data?.rowSpan ?? DEFAULT_ROW_SPAN;

        return (
            <div className="space-y-3">
                {/* COL SPAN */}
                <div>
                    <label className="text-xs text-muted-foreground">
                        Column Span
                    </label>

                    <select
                        className="w-full rounded border p-2"
                        value={colSpan}
                        onChange={(e) =>
                            onChange({ colSpan: Number(e.target.value) })
                        }
                    >
                        {ALLOWED_SPAN.map((n) => (
                            <option key={n} value={n}>
                                span {n}
                            </option>
                        ))}
                    </select>
                </div>

                {/* ROW SPAN */}
                <div>
                    <label className="text-xs text-muted-foreground">
                        Row Span
                    </label>

                    <select
                        className="w-full rounded border p-2"
                        value={rowSpan}
                        onChange={(e) =>
                            onChange({ rowSpan: Number(e.target.value) })
                        }
                    >
                        {ALLOWED_SPAN.map((n) => (
                            <option key={n} value={n}>
                                span {n}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        );
    },
};
