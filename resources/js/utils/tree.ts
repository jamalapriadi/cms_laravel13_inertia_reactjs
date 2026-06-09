export interface MenuItem {
    id: string | number;
    title: string;
    url?: string;
    children?: MenuItem[];
}

export interface TreeMenuItem {
    id: string | number;
    title?: string;
    url?: string;
    type?: string;
    target?: string;
    icon?: string | null;
    meta?: Record<string, unknown>;
    translations?: Record<string, { title?: string; url?: string }>;
    children?: TreeMenuItem[];
    parentId?: string | number | null;
    depth?: number;
    index?: number;
}

/**
 * FLATTEN TREE
 */
export function flattenTree(
    items: TreeMenuItem[],
    parentId: string | number | null = null,
    depth = 0,
): TreeMenuItem[] {
    let result: TreeMenuItem[] = [];

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
export function buildTree(flat: TreeMenuItem[]): TreeMenuItem[] {
    const map = new Map<string | number, TreeMenuItem>();
    const roots: TreeMenuItem[] = [];

    flat.forEach((item: TreeMenuItem) => {
        map.set(item.id, { ...item, children: [] });
    });

    flat.forEach((item: TreeMenuItem) => {
        const node = map.get(item.id);

        if (!node) {
            return;
        }

        if (item.parentId && map.has(item.parentId)) {
            map.get(item.parentId)?.children?.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
}

export function getProjection(
    flat: TreeMenuItem[],
    activeId: string | number,
    overId: string | number,
    offsetX: number,
    indentationWidth = 20,
) {
    const activeIndex = flat.findIndex((i) => i.id === activeId);
    const overIndex = flat.findIndex((i) => i.id === overId);

    const newItems = [...flat];
    const [moved] = newItems.splice(activeIndex, 1);
    newItems.splice(overIndex, 0, moved);

    const previousItem = newItems[overIndex - 1];

    let depth = previousItem?.depth ?? 0;

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
