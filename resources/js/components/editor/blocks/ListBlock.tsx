export default {
    type: 'list',

    create: () => ({
        items: ['Item 1', 'Item 2'],
    }),

    render: ({ data }: any) => {
        const items: string[] = data?.items ?? [];

        if (!items.length) {
            return (
                <div className="text-sm text-muted-foreground">Empty list</div>
            );
        }

        return (
            <ul className="list-disc space-y-1 pl-5">
                {items.map((item, i) => (
                    <li key={`${item}-${i}`}>{item}</li>
                ))}
            </ul>
        );
    },

    editor: ({ data, onChange }: any) => {
        const items: string[] = data?.items ?? [];

        const updateItem = (index: number, value: string) => {
            const newItems = [...items];
            newItems[index] = value;
            onChange({ items: newItems });
        };

        const addItem = () => {
            onChange({
                items: [...items, 'New item'],
            });
        };

        const removeItem = (index: number) => {
            const newItems = items.filter((_: any, i: number) => i !== index);
            onChange({ items: newItems });
        };

        return (
            <div className="space-y-3">
                <label className="text-xs text-muted-foreground">
                    List Items
                </label>

                {items.map((item, i) => (
                    <div key={`${item}-${i}`} className="flex gap-2">
                        <input
                            className="flex-1 rounded border p-2"
                            value={item}
                            onChange={(e) => updateItem(i, e.target.value)}
                            placeholder={`Item ${i + 1}`}
                        />

                        <button
                            type="button"
                            onClick={() => removeItem(i)}
                            className="rounded border px-2 text-sm text-red-500 hover:bg-red-50"
                        >
                            ✕
                        </button>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addItem}
                    className="w-full rounded border p-2 text-sm hover:bg-muted"
                >
                    + Add item
                </button>
            </div>
        );
    },
};
