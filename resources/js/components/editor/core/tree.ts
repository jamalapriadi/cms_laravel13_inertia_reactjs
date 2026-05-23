// core/tree.ts

import type { BlockInstance } from '@/types/block';

export type DropPosition = 'before' | 'after' | 'inside';

const layoutBlocks = [
    'columns',
    'flex-row',
    'flex-column',
    'card',
    'tabs',
    'accordion',
    'slider',
];

const contentBlocks = [
    'text',
    'paragraph',
    'rich-editor',
    'heading',
    'image',
    'button',
    'icon',
    'divider',
    'spacer',
    'table',
    'list',
    'quote',
    'code',
];

/**
 * 🔥 RULES (SCALABLE)
 */
export function canDrop(target: BlockInstance, block: BlockInstance): boolean {
    if (target.type === 'section') {
        return ['container', 'column', 'grid', ...layoutBlocks].includes(
            block.type,
        );
    }

    if (target.type === 'container') {
        return !['section', 'container', 'column'].includes(block.type);
    }

    if (target.type === 'column') {
        return !['column', 'grid'].includes(block.type);
    }

    if (target.type === 'grid') {
        return block.type === 'grid-item';
    }

    if (target.type === 'grid-item') {
        return [...contentBlocks, ...layoutBlocks].includes(block.type);
    }

    if (layoutBlocks.includes(target.type)) {
        return block.type !== 'section';
    }

    return true;
}

/**
 * 🔥 AUTO WRAP (GRID)
 */
function wrapIfNeeded(
    target: BlockInstance,
    block: BlockInstance,
): BlockInstance {
    // 👉 drop langsung ke grid → bungkus jadi grid-item
    if (target.type === 'grid' && block.type !== 'grid-item') {
        return {
            id: Date.now(),
            type: 'grid-item',
            data: {
                colSpan: 1,
                rowSpan: 1,
            },
            children: [block],
        };
    }

    return block;
}

/**
 * 🔥 FIND & REMOVE
 */
export function findAndRemove(
    items: BlockInstance[],
    id: number,
): BlockInstance | null {
    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.id === id) {
            return items.splice(i, 1)[0];
        }

        if (item.children?.length) {
            const found = findAndRemove(item.children, id);

            if (found) {
                return found;
            }
        }
    }

    return null;
}

/**
 * 🔥 INSERT (INSIDE ONLY)
 */
export function insertInside(
    items: BlockInstance[],
    targetId: number,
    block: BlockInstance,
): boolean {
    for (const item of items) {
        if (item.id === targetId) {
            const finalBlock = wrapIfNeeded(item, block);

            if (!canDrop(item, finalBlock)) {
                return false;
            }

            item.children = item.children || [];
            item.children.push(finalBlock);

            return true;
        }

        if (item.children?.length) {
            const inserted = insertInside(item.children, targetId, block);

            if (inserted) {
                return true;
            }
        }
    }

    return false;
}

/**
 * 🔥 INSERT WITH POSITION
 */
export function insertWithPosition(
    items: BlockInstance[],
    targetId: number,
    block: BlockInstance,
    position: DropPosition,
): boolean {
    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.id === targetId) {
            // 🔥 BEFORE / AFTER (tidak perlu rule parent)
            if (position === 'before') {
                items.splice(i, 0, block);

                return true;
            }

            if (position === 'after') {
                items.splice(i + 1, 0, block);

                return true;
            }

            if (position === 'inside') {
                const finalBlock = wrapIfNeeded(item, block);

                if (!canDrop(item, finalBlock)) {
                    return false;
                }

                item.children = item.children || [];
                item.children.push(finalBlock);

                return true;
            }
        }

        if (item.children?.length) {
            const inserted = insertWithPosition(
                item.children,
                targetId,
                block,
                position,
            );

            if (inserted) {
                return true;
            }
        }
    }

    return false;
}

/**
 * 🔥 DROP POSITION DETECTOR
 */
export function getDropPosition(event: any): DropPosition {
    const { activatorEvent, active, over } = event;

    if (!over) {
        return 'inside';
    }

    const rect = over.rect;
    const activeRect = active?.rect?.current?.translated;
    const mouseY = activeRect
        ? activeRect.top + activeRect.height / 2
        : activatorEvent?.clientY;

    if (!mouseY) {
        return 'inside';
    }

    const thresholdTop = rect.top + rect.height * 0.25;
    const thresholdBottom = rect.top + rect.height * 0.75;

    if (mouseY < thresholdTop) {
        return 'before';
    }

    if (mouseY > thresholdBottom) {
        return 'after';
    }

    return 'inside';
}
