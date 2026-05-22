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
                padding: '40px',
                background: '#ffffff',
            },
            children: [
                {
                    id: generateId(),
                    type: 'column',
                    data: { width: '100%' },
                    children: [],
                },
            ],
        }),

        column: () => ({
            ...base,
            data: {
                width: '100%',
            },
        }),
    };

    return overrides[type] ? overrides[type]() : base;
};
