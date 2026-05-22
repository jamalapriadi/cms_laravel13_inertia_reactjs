interface FlexColumnData {
    gap: number;
    align: string;
}

export default {
    type: 'flex-column',

    create(): FlexColumnData {
        return {
            gap: 16,
            align: 'stretch',
        };
    },

    render({ data, children }: any) {
        const hasChildren = children && children.length > 0;

        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: data?.align || 'stretch',
                    gap: `${Number(data?.gap) || 16}px`,
                }}
                className="min-h-20 rounded border border-dashed border-muted-foreground/30 p-3"
            >
                {hasChildren ? (
                    children
                ) : (
                    <div className="text-xs text-muted-foreground">
                        Drop content into flex column
                    </div>
                )}
            </div>
        );
    },

    editor({ data, onChange }: any) {
        return (
            <div className="space-y-3">
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

                <div>
                    <label className="text-xs text-muted-foreground">
                        Align
                    </label>
                    <select
                        className="w-full rounded border p-2"
                        value={data?.align ?? 'stretch'}
                        onChange={(e) => onChange({ align: e.target.value })}
                    >
                        <option value="stretch">Stretch</option>
                        <option value="flex-start">Start</option>
                        <option value="center">Center</option>
                        <option value="flex-end">End</option>
                    </select>
                </div>
            </div>
        );
    },
};
