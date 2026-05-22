interface ContainerData {
    maxWidth: string;
    padding: string;
    align: 'left' | 'center' | 'right';
}

const alignMap: Record<ContainerData['align'], string> = {
    left: '0 auto 0 0',
    center: '0 auto',
    right: '0 0 0 auto',
};

export default {
    type: 'container',

    create(): ContainerData {
        return {
            maxWidth: '1120px',
            padding: '24px',
            align: 'center',
        };
    },

    render({ data, children }: any) {
        const align = data?.align ?? 'center';
        const hasChildren = children && children.length > 0;

        return (
            <div
                style={{
                    maxWidth: data?.maxWidth || '1120px',
                    padding: data?.padding || '24px',
                    margin: alignMap[align as ContainerData['align']],
                }}
                className="min-h-20 w-full rounded border border-dashed border-muted-foreground/30"
            >
                {hasChildren ? (
                    <div className="space-y-3">{children}</div>
                ) : (
                    <div className="flex min-h-16 items-center justify-center text-xs text-muted-foreground">
                        Drop content here
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
                        Max width
                    </label>
                    <input
                        className="w-full rounded border p-2"
                        value={data?.maxWidth ?? ''}
                        onChange={(e) => onChange({ maxWidth: e.target.value })}
                        placeholder="1120px"
                    />
                </div>

                <div>
                    <label className="text-xs text-muted-foreground">
                        Padding
                    </label>
                    <input
                        className="w-full rounded border p-2"
                        value={data?.padding ?? ''}
                        onChange={(e) => onChange({ padding: e.target.value })}
                        placeholder="24px"
                    />
                </div>

                <div>
                    <label className="text-xs text-muted-foreground">
                        Alignment
                    </label>
                    <select
                        className="w-full rounded border p-2"
                        value={data?.align ?? 'center'}
                        onChange={(e) => onChange({ align: e.target.value })}
                    >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                    </select>
                </div>
            </div>
        );
    },
};
