import { BlockInstance } from '@/types/block';
import { BLOCK_REGISTRY } from './blocks/registry';

interface Props {
    block: BlockInstance;
    isActive?: boolean;
    onClick?: () => void;
}

export default function BlockRenderer({ block, isActive = false, onClick }: Props) {
    const Component = BLOCK_REGISTRY[block.type];

    if (!Component) {
        return null;
    }

    return (
        <div
            onClick={onClick}
            className={`relative cursor-pointer rounded border p-2 transition ${
                isActive
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-border hover:border-muted-foreground/40'
            }`}
        >
            {Component.render({
                data: block.data,

                /**
                 * 🔥 recursive children render
                 */
                children: block.children?.map((child) => (
                    <BlockRenderer
                        key={child.id}
                        block={child}
                        isActive={false}
                    />
                )),
            })}
        </div>
    );
}
