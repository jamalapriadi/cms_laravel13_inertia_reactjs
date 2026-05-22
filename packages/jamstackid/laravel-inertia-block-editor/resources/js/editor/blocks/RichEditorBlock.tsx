import TinyEditor from '../TinyEditor';

interface RichEditorData {
    html: string;
}

export default {
    type: 'rich-editor',

    create(): RichEditorData {
        return {
            html: '<p>Write rich content here...</p>',
        };
    },

    render({ data }: any) {
        const html = data?.html ?? '';

        if (!html) {
            return (
                <div className="rounded border border-dashed p-4 text-sm text-muted-foreground">
                    Empty rich content
                </div>
            );
        }

        return (
            <div
                className="prose-sm prose max-w-none"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    },

    editor({ data, onChange }: any) {
        return (
            <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                    Rich Content
                </label>
                <TinyEditor
                    value={data?.html ?? ''}
                    onChange={(html) => onChange({ html })}
                    height={320}
                />
            </div>
        );
    },
};
