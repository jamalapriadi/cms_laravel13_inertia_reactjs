import { BlockInstance } from '@/types/block';
import { BLOCK_REGISTRY } from './blocks/registry';

interface Props {
    block: BlockInstance;
    selectedId?: number;
    onSelect?: (block: BlockInstance) => void;
}

export default function BlockRenderer({ block, selectedId, onSelect }: Props) {
    const Component = BLOCK_REGISTRY[block.type];

    if (!Component) {
        return null;
    }

    const isActive = selectedId === block.id;

    return (
        <div
            className={`relative cursor-pointer rounded border p-2 transition ${
                isActive
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-border'
            }`}
        >
            {Component.render({
                data: block.data,

                /**
                 * 🔥 recursive children render (FIXED)
                 */
                children: block.children?.map((child) => (
                    <BlockRenderer
                        key={child.id}
                        block={child}
                        selectedId={selectedId}
                        onSelect={onSelect}
                    />
                )),
            })}
        </div>
    );
}
