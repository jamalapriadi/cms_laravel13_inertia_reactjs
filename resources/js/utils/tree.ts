export interface MenuItem {
    id: string | number;
    title: string;
    url?: string;
    children?: MenuItem[];
}

/**
 * FLATTEN TREE
 */
export function flattenTree(
    items: MenuItem[],
    parentId: any = null,
    depth = 0,
) {
    let result: any[] = [];

    items.forEach((item, index) => {
        result.push({
            ...item,
            parentId,
            depth,
            index,
        });

        if (item.children?.length) {
            result = result.concat(
                flattenTree(item.children, item.id, depth + 1),
            );
        }
    });

    return result;
}

/**
 * BUILD TREE FROM FLAT
 */
export function buildTree(flat) {
    const map = new Map();
    const roots = [];

    flat.forEach((item) => {
        map.set(item.id, { ...item, children: [] });
    });

    flat.forEach((item) => {
        const node = map.get(item.id);

        if (item.parentId && map.has(item.parentId)) {
            map.get(item.parentId).children.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
}

export function getProjection(
    flat,
    activeId,
    overId,
    offsetX,
    indentationWidth = 20,
) {
    const activeIndex = flat.findIndex((i) => i.id === activeId);
    const overIndex = flat.findIndex((i) => i.id === overId);

    const newItems = [...flat];
    const [moved] = newItems.splice(activeIndex, 1);
    newItems.splice(overIndex, 0, moved);

    const previousItem = newItems[overIndex - 1];

    let depth = previousItem ? previousItem.depth : 0;

    // 🔥 HITUNG DEPTH BERDASARKAN DRAG X
    depth += Math.round(offsetX / indentationWidth);

    depth = Math.max(0, depth);

    const parentId = depth === 0 ? null : (previousItem?.id ?? null);

    return {
        depth,
        parentId,
        newItems,
    };
}
