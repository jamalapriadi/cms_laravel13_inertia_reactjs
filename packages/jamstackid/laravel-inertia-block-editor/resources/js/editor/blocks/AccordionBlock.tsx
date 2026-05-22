import { Children } from 'react';

interface AccordionData {
    labels: string[];
}

function parseLabels(labels: unknown): string[] {
    return Array.isArray(labels) && labels.length > 0
        ? labels.map(String)
        : ['Item 1', 'Item 2'];
}

export default {
    type: 'accordion',

    create(): AccordionData {
        return {
            labels: ['Item 1', 'Item 2'],
        };
    },

    render({ data, children }: any) {
        const labels = parseLabels(data?.labels);
        const panels = Children.toArray(children);

        return (
            <div className="space-y-2 rounded border border-dashed border-muted-foreground/30 p-3">
                {labels.map((label, index) => (
                    <details
                        key={`${label}-${index}`}
                        className="rounded border bg-background p-3"
                        open={index === 0}
                    >
                        <summary className="cursor-pointer text-sm font-medium">
                            {label}
                        </summary>
                        <div className="pt-3">
                            {panels[index] ?? (
                                <div className="text-xs text-muted-foreground">
                                    Drop content for {label}
                                </div>
                            )}
                        </div>
                    </details>
                ))}
            </div>
        );
    },

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
                    placeholder={'Item 1\nItem 2'}
                />
            </div>
        );
    },
};
