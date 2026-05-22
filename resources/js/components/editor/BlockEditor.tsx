// components/editor/BlockEditor.tsx

import { BLOCK_REGISTRY } from './blocks/registry';

/**
 * Inner editor component — rendered as a proper React component
 * so React tracks DOM identity and inputs don't lose focus on re-render.
 */
function BlockEditorInner({
    data,
    onChange,
    editorFn,
}: {
    data: any;
    onChange: (newData: any) => void;
    editorFn: (props: { data: any; onChange: (v: any) => void }) => React.ReactNode;
}) {
    return <>{editorFn({ data, onChange })}</>;
}

export default function BlockEditor({ block, updateBlock }: any) {
    if (!block) {
        return null;
    }

    const Component = BLOCK_REGISTRY[block.type];

    if (!Component || !Component.editor) {
        return (
            <p className="text-sm text-muted-foreground">
                No editor available for block type: {block.type}
            </p>
        );
    }

    return (
        <div>
            <BlockEditorInner
                key={block.id}
                data={block.data}
                onChange={(newData: any) => updateBlock(block.id, newData)}
                editorFn={Component.editor}
            />
        </div>
    );
}
