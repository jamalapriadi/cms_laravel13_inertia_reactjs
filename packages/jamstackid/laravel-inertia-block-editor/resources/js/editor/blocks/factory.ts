import { BLOCK_REGISTRY } from './registry';

let blockId = Date.now(); // use timestamp base to avoid collisions after page reload

const generateId = () => blockId++;

export const createBlock = (type: string): any => {
    /**
     * ✅ Use the registry's create() to get proper default data per block type
     */
    const component = BLOCK_REGISTRY[type as keyof typeof BLOCK_REGISTRY];
    const defaultData = component?.create ? component.create() : {};

    const base = {
        id: generateId(),
        type,
        data: defaultData,
        styles: {},
        children: [] as any[],
    };

    /**
     * ✅ Special structure overrides per block
     */
    const overrides: Record<string, () => any> = {
        section: () => ({
            ...base,
            data: {
                padding: '48px 24px',
                background: '#ffffff',
            },
            children: [
                {
                    id: generateId(),
                    type: 'container',
                    data: {
                        maxWidth: '1120px',
                        padding: '0px',
                        align: 'center',
                    },
                    children: [],
                },
            ],
        }),

        container: () => ({
            ...base,
            data: {
                maxWidth: '1120px',
                padding: '24px',
                align: 'center',
            },
        }),

        column: () => ({
            ...base,
            data: {
                width: '100%',
            },
        }),

        grid: () => ({
            ...base,
            data: {
                columns: 2,
                gap: 16,
            },
            children: [
                {
                    id: generateId(),
                    type: 'grid-item',
                    data: {
                        colSpan: 1,
                        rowSpan: 1,
                    },
                    styles: {},
                    children: [],
                },
                {
                    id: generateId(),
                    type: 'grid-item',
                    data: {
                        colSpan: 1,
                        rowSpan: 1,
                    },
                    styles: {},
                    children: [],
                },
            ],
        }),
    };

    return overrides[type] ? overrides[type]() : base;
};
