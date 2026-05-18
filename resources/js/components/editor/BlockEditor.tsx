// components/editor/BlockEditor.tsx

import { BLOCK_REGISTRY } from './blocks/registry';

export default function BlockEditor({ block, updateBlock }: any) {
    if (!block) {
        return null;
    }

    const Component = BLOCK_REGISTRY[block.type];

    if (!Component) {
        return null;
    }

    return (
        <div>
            {Component.editor({
                data: block.data,
                onChange: (newData: any) => updateBlock(block.id, newData),
            })}
        </div>
    );
}
