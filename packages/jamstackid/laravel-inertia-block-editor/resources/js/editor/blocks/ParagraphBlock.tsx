export default {
    type: 'paragraph',

    create: () => ({
        text: 'Paragraph...',
    }),

    render: ({ data }: any) => {
        const text = data?.text ?? '';

        if (!text) {
            return (
                <p className="text-sm text-muted-foreground italic">
                    Empty paragraph...
                </p>
            );
        }

        return <p className="text-base leading-relaxed">{text}</p>;
    },

    editor: ({ data, onChange }: any) => {
        const text = data?.text ?? '';

        return (
            <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                    Paragraph
                </label>

                <textarea
                    className="min-h-25 w-full resize-y rounded border p-2 leading-relaxed"
                    value={text}
                    onChange={(e) => onChange({ text: e.target.value })}
                    placeholder="Write your paragraph..."
                />
            </div>
        );
    },
};
