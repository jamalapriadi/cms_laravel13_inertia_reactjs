interface SpacerData {
    height: number;
}

export default {
    type: 'spacer',

    create(): SpacerData {
        return {
            height: 32,
        };
    },

    render({ data }: any) {
        const height = Number(data?.height) || 32;

        return (
            <div
                style={{ height: `${height}px` }}
                className="rounded border border-dashed border-muted-foreground/30 bg-muted/20"
                aria-hidden="true"
            />
        );
    },

    editor({ data, onChange }: any) {
        return (
            <div>
                <label className="text-xs text-muted-foreground">Height</label>
                <input
                    type="number"
                    min={4}
                    max={320}
                    className="w-full rounded border p-2"
                    value={data?.height ?? 32}
                    onChange={(e) =>
                        onChange({ height: Number(e.target.value) })
                    }
                />
            </div>
        );
    },
};
