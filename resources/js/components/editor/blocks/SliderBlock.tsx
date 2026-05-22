interface SliderData {
    gap: number;
    slideWidth: string;
}

export default {
    type: 'slider',

    create(): SliderData {
        return {
            gap: 16,
            slideWidth: '280px',
        };
    },

    render({ data, children }: any) {
        const hasChildren = children && children.length > 0;

        return (
            <div className="rounded border border-dashed border-muted-foreground/30 p-3">
                <div
                    style={{ gap: `${Number(data?.gap) || 16}px` }}
                    className="flex snap-x overflow-x-auto pb-2"
                >
                    {hasChildren ? (
                        children.map((child: any, index: number) => (
                            <div
                                key={child?.key ?? index}
                                style={{
                                    flexBasis: data?.slideWidth || '280px',
                                }}
                                className="shrink-0 snap-start"
                            >
                                {child}
                            </div>
                        ))
                    ) : (
                        <div className="text-xs text-muted-foreground">
                            Drop slides here
                        </div>
                    )}
                </div>
            </div>
        );
    },

    editor({ data, onChange }: any) {
        return (
            <div className="space-y-3">
                <div>
                    <label className="text-xs text-muted-foreground">
                        Slide width
                    </label>
                    <input
                        className="w-full rounded border p-2"
                        value={data?.slideWidth ?? '280px'}
                        onChange={(e) =>
                            onChange({ slideWidth: e.target.value })
                        }
                    />
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
