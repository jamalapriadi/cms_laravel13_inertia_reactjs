import type { BlockComponent } from './block';

type SectionData = {
    padding?: string;
    background?: string;
};

export const SectionBlock: BlockComponent<SectionData> = {
    type: 'section',

    create: () => ({
        padding: '48px 24px',
        background: '#ffffff',
    }),

    render: ({ data, children }) => {
        const padding = data?.padding || '48px 24px';
        const background = data?.background || '#ffffff';

        return (
            <div
                style={{ padding, background }}
                className="space-y-4 rounded border border-dashed border-muted-foreground/30"
            >
                {children ? (
                    children
                ) : (
                    <div className="text-xs text-muted-foreground">
                        Drop container or grid here...
                    </div>
                )}
            </div>
        );
    },

    editor: ({ data, onChange }) => {
        return (
            <div className="space-y-3">
                <div>
                    <label className="text-xs text-muted-foreground">
                        Padding
                    </label>
                    <input
                        className="input w-full border"
                        value={data.padding || ''}
                        onChange={(e) => onChange({ padding: e.target.value })}
                        placeholder="e.g. 48px 24px"
                    />
                </div>

                <div>
                    <label className="text-xs text-muted-foreground">
                        Background
                    </label>
                    <input
                        className="input w-full border"
                        value={data.background || ''}
                        onChange={(e) =>
                            onChange({ background: e.target.value })
                        }
                        placeholder="#ffffff"
                    />
                </div>
            </div>
        );
    },
};
