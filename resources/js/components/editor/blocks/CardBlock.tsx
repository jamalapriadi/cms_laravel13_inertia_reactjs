interface CardData {
    padding: string;
    background: string;
    borderColor: string;
    shadow: boolean;
}

export default {
    type: 'card',

    create(): CardData {
        return {
            padding: '24px',
            background: '#ffffff',
            borderColor: '#e5e7eb',
            shadow: true,
        };
    },

    render({ data, children }: any) {
        const hasChildren = children && children.length > 0;

        return (
            <div
                style={{
                    padding: data?.padding || '24px',
                    background: data?.background || '#ffffff',
                    borderColor: data?.borderColor || '#e5e7eb',
                }}
                className={`min-h-20 rounded-lg border ${
                    data?.shadow === false ? '' : 'shadow-sm'
                }`}
            >
                {hasChildren ? (
                    <div className="space-y-3">{children}</div>
                ) : (
                    <div className="text-center text-xs text-muted-foreground">
                        Drop content into card
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
                        Padding
                    </label>
                    <input
                        className="w-full rounded border p-2"
                        value={data?.padding ?? '24px'}
                        onChange={(e) => onChange({ padding: e.target.value })}
                    />
                </div>

                <div>
                    <label className="text-xs text-muted-foreground">
                        Background
                    </label>
                    <input
                        type="color"
                        className="h-10 w-full rounded border p-1"
                        value={data?.background ?? '#ffffff'}
                        onChange={(e) =>
                            onChange({ background: e.target.value })
                        }
                    />
                </div>

                <div>
                    <label className="text-xs text-muted-foreground">
                        Border
                    </label>
                    <input
                        type="color"
                        className="h-10 w-full rounded border p-1"
                        value={data?.borderColor ?? '#e5e7eb'}
                        onChange={(e) =>
                            onChange({ borderColor: e.target.value })
                        }
                    />
                </div>

                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                        type="checkbox"
                        checked={data?.shadow !== false}
                        onChange={(e) => onChange({ shadow: e.target.checked })}
                    />
                    Shadow
                </label>
            </div>
        );
    },
};
