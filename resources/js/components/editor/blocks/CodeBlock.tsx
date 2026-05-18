export default {
    type: 'code',

    create: () => ({
        code: '',
    }),

    render: ({ data }: any) => {
        const code = data?.code ?? '';

        return (
            <pre className="overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm text-neutral-100">
                <code className="font-mono">{code}</code>
            </pre>
        );
    },

    editor: ({ data, onChange }: any) => {
        return (
            <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Code</label>

                <textarea
                    className="min-h-[120px] w-full resize-y rounded border p-2 font-mono text-sm"
                    value={data?.code ?? ''}
                    onChange={(e) => onChange({ code: e.target.value })}
                    placeholder="Write your code here..."
                />
            </div>
        );
    },
};
