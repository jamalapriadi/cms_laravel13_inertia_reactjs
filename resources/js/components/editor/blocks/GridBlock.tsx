const DEFAULT_COLUMNS = 2;
const DEFAULT_GAP = 16;

const ALLOWED_COLUMNS = [1, 2, 3, 4, 5, 6];

export default {
    type: 'grid',

    create: () => ({
        columns: DEFAULT_COLUMNS,
        gap: DEFAULT_GAP,
    }),

    render: ({ data, children }: any) => {
        const columns = ALLOWED_COLUMNS.includes(data?.columns)
            ? data.columns
            : DEFAULT_COLUMNS;

        const gap = typeof data?.gap === 'number' ? data.gap : DEFAULT_GAP;

        /**
         * ✅ FILTER: hanya grid-item yang boleh masuk
         */
        const validChildren = children?.filter(
            (child: any) => child?.props?.block?.type === 'grid-item',
        );

        const hasChildren = validChildren && validChildren.length > 0;

        return (
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    gap: `${gap}px`,
                }}
                className="relative min-h-20 rounded border border-dashed p-3 transition hover:border-primary/50"
            >
                {hasChildren ? (
                    validChildren
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center text-center">
                        <p className="text-xs text-muted-foreground">
                            Drop <b>Grid Item</b> here
                        </p>

                        <p className="text-[10px] text-muted-foreground/70">
                            (Grid hanya menerima Grid Item)
                        </p>
                    </div>
                )}
            </div>
        );
    },

    editor: ({ data, onChange }: any) => {
        const columns = data?.columns ?? DEFAULT_COLUMNS;
        const gap = data?.gap ?? DEFAULT_GAP;

        return (
            <div className="space-y-3">
                {/* COLUMNS */}
                <div>
                    <label className="text-xs text-muted-foreground">
                        Columns
                    </label>

                    <select
                        className="w-full rounded border p-2"
                        value={columns}
                        onChange={(e) =>
                            onChange({
                                columns: Number(e.target.value),
                            })
                        }
                    >
                        {ALLOWED_COLUMNS.map((col) => (
                            <option key={col} value={col}>
                                {col} Columns
                            </option>
                        ))}
                    </select>
                </div>

                {/* GAP */}
                <div>
                    <label className="text-xs text-muted-foreground">
                        Gap (px)
                    </label>

                    <input
                        type="number"
                        className="w-full rounded border p-2"
                        value={gap}
                        onChange={(e) =>
                            onChange({
                                gap: Number(e.target.value),
                            })
                        }
                    />
                </div>
            </div>
        );
    },
};
