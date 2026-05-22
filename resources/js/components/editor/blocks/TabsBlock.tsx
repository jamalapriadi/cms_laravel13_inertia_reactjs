import { Children, useState } from 'react';

interface TabsData {
    labels: string[];
}

function parseLabels(labels: unknown): string[] {
    return Array.isArray(labels) && labels.length > 0
        ? labels.map(String)
        : ['Tab 1', 'Tab 2'];
}

function TabsPreview({ data, children }: any) {
    const labels = parseLabels(data?.labels);
    const panels = Children.toArray(children);
    const [active, setActive] = useState(0);

    return (
        <div className="rounded border border-dashed border-muted-foreground/30 p-3">
            <div className="flex flex-wrap gap-2 border-b pb-2">
                {labels.map((label, index) => (
                    <button
                        key={`${label}-${index}`}
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            setActive(index);
                        }}
                        className={`rounded px-3 py-1.5 text-xs font-medium ${
                            active === index
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="min-h-20 pt-3">
                {panels[active] ?? (
                    <div className="text-xs text-muted-foreground">
                        Drop content for {labels[active]}
                    </div>
                )}
            </div>
        </div>
    );
}

export default {
    type: 'tabs',

    create(): TabsData {
        return {
            labels: ['Tab 1', 'Tab 2'],
        };
    },

    render: (props: any) => <TabsPreview {...props} />,

    editor({ data, onChange }: any) {
        return (
            <div>
                <label className="text-xs text-muted-foreground">Labels</label>
                <textarea
                    className="min-h-24 w-full rounded border p-2 text-sm"
                    value={parseLabels(data?.labels).join('\n')}
                    onChange={(e) =>
                        onChange({
                            labels: e.target.value
                                .split('\n')
                                .map((label) => label.trim())
                                .filter(Boolean),
                        })
                    }
                    placeholder={'Tab 1\nTab 2'}
                />
            </div>
        );
    },
};
