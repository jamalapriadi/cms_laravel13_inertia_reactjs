export default {
    type: 'quote',

    create: () => ({
        text: 'Quote...',
        author: '',
    }),

    render: ({ data }: any) => {
        const text = data?.text ?? '';
        const author = data?.author ?? '';

        if (!text) {
            return (
                <div className="text-sm text-muted-foreground italic">
                    Empty quote...
                </div>
            );
        }

        return (
            <blockquote className="border-l-4 border-primary/50 pl-4 text-muted-foreground italic">
                <p className="leading-relaxed">{text}</p>

                {author && (
                    <footer className="mt-2 text-sm text-foreground not-italic">
                        — {author}
                    </footer>
                )}
            </blockquote>
        );
    },

    editor: ({ data, onChange }: any) => {
        const text = data?.text ?? '';
        const author = data?.author ?? '';

        return (
            <div className="space-y-3">
                {/* TEXT */}
                <div>
                    <label className="text-xs text-muted-foreground">
                        Quote
                    </label>
                    <textarea
                        className="min-h-[100px] w-full resize-y rounded border p-2 italic"
                        value={text}
                        onChange={(e) => onChange({ text: e.target.value })}
                        placeholder="Write your quote..."
                    />
                </div>

                {/* AUTHOR */}
                <div>
                    <label className="text-xs text-muted-foreground">
                        Author
                    </label>
                    <input
                        className="w-full rounded border p-2"
                        placeholder="Author name..."
                        value={author}
                        onChange={(e) => onChange({ author: e.target.value })}
                    />
                </div>
            </div>
        );
    },
};
