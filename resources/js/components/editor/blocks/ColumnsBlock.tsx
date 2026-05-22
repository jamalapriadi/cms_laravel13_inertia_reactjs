interface ColumnsData {
    columns: number;
    gap: number;
}

export default {
    type: 'columns',

    create(): ColumnsData {
        return {
            columns: 2,
            gap: 16,
        };
    },

    render({ data, children }: any) {
        const columns = Number(data?.columns) || 2;
        const gap = Number(data?.gap) || 16;
        const hasChildren = children && children.length > 0;

        return (
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    gap: `${gap}px`,
                }}
                className="min-h-20 rounded border border-dashed border-muted-foreground/30 p-3"
            >
                {hasChildren ? (
                    children
                ) : (
                    <div className="col-span-full text-center text-xs text-muted-foreground">
                        Drop content into columns
                    </div>
                )}
            </div>
        );
    },

    editor({ data, onChange }: any) {
        return (
            <div className="space-y-3">
                <div>
                    <label className="text-xs text-muted-foreground">
                        Columns
                    </label>
                    <select
                        className="w-full rounded border p-2"
                        value={data?.columns ?? 2}
                        onChange={(e) =>
                            onChange({ columns: Number(e.target.value) })
                        }
                    >
                        {[2, 3, 4, 5, 6].map((column) => (
                            <option key={column} value={column}>
                                {column} columns
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-xs text-muted-foreground">Gap</label>
                    <input
                        type="number"
                        min={0}
                        className="w-full rounded border p-2"
                        value={data?.gap ?? 16}
                        onChange={(e) =>
                            onChange({ gap: Number(e.target.value) })
                        }
                    />
                </div>
            </div>
        );
    },
};
