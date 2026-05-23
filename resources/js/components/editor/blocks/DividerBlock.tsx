interface DividerData {
    color: string;
    thickness: number;
    width: string;
    style: 'solid' | 'dashed' | 'dotted';
}

export default {
    type: 'divider',

    create(): DividerData {
        return {
            color: '#e5e7eb',
            thickness: 1,
            width: '100%',
            style: 'solid',
        };
    },

    render({ data }: any) {
        return (
            <hr
                style={{
                    borderTopColor: data?.color || '#e5e7eb',
                    borderTopWidth: `${Number(data?.thickness) || 1}px`,
                    borderTopStyle: data?.style || 'solid',
                    width: data?.width || '100%',
                }}
                className="mx-auto border-0"
            />
        );
    },

    editor({ data, onChange }: any) {
        return (
            <div className="space-y-3">
                <div>
                    <label className="text-xs text-muted-foreground">
                        Color
                    </label>
                    <input
                        type="color"
                        className="h-10 w-full rounded border p-1"
                        value={data?.color ?? '#e5e7eb'}
                        onChange={(e) => onChange({ color: e.target.value })}
                    />
                </div>

                <div>
                    <label className="text-xs text-muted-foreground">
                        Thickness
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={16}
                        className="w-full rounded border p-2"
                        value={data?.thickness ?? 1}
                        onChange={(e) =>
                            onChange({ thickness: Number(e.target.value) })
                        }
                    />
                </div>

                <div>
                    <label className="text-xs text-muted-foreground">
                        Width
                    </label>
                    <input
                        className="w-full rounded border p-2"
                        value={data?.width ?? '100%'}
                        onChange={(e) => onChange({ width: e.target.value })}
                        placeholder="100%"
                    />
                </div>

                <div>
                    <label className="text-xs text-muted-foreground">
                        Style
                    </label>
                    <select
                        className="w-full rounded border p-2"
                        value={data?.style ?? 'solid'}
                        onChange={(e) => onChange({ style: e.target.value })}
                    >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                    </select>
                </div>
            </div>
        );
    },
};
