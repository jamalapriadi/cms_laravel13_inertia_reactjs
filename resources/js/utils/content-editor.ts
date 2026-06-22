export type ContentEditorMode = 'classic_editor' | 'block_editor';

export const DEFAULT_CONTENT_EDITOR: ContentEditorMode = 'block_editor';

export const buildClassicEditorBlocks = (html: string) => {
    const content = html.trim();

    if (!content) {
        return [];
    }

    return [
        {
            type: 'rich-editor',
            data: {
                html: content,
            },
            styles: {},
            children: [],
        },
    ];
};
