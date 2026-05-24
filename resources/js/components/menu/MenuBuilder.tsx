import MenuSourcePanel from './MenuSourcePanel';
import MenuTree from './MenuTree';

export default function MenuBuilder({ tree, setTree, locale }: any) {
    function handleAdd(item: any) {
        const newItem = {
            id: `temp-${Date.now()}`,
            parentId: null,
            depth: 0,
            url: item.url || '',
            type: 'custom',
            target: '_self',
            children: [],
            translations: {
                [locale]: {
                    title: item.title || 'Menu Item',
                    url: item.url || '',
                },
            },
        };

        // 🔥 gunakan callback (hindari stale state)
        setTree((prev: any[]) => [...prev, newItem]);
    }

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4">
                <MenuSourcePanel onAdd={handleAdd} />
            </div>

            <div className="lg:col-span-8">
                <MenuTree data={tree} setData={setTree} locale={locale} />
            </div>
        </div>
    );
}
