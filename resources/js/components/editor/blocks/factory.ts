let blockId = 1;

const generateId = () => blockId++;

export const createBlock = (type: string): any => {
    const base = {
        id: generateId(),
        type,
        data: {},
        children: [] as any[],
    };

    /**
     * ✅ DEFAULT CONFIG PER BLOCK
     */
    const defaults: Record<string, () => any> = {
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

    /**
     * ✅ RETURN BASED ON TYPE
     */
    return defaults[type] ? defaults[type]() : base;
};
