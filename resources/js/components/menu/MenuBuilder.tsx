import MenuSourcePanel from './MenuSourcePanel';
import MenuTree from './MenuTree';

export default function MenuBuilder({ tree, setTree, locale }) {
    function handleAdd(item: any) {
        // 🔥 generate id sementara (frontend only)
        const newItem = {
            id: `temp-${Date.now()}`,
            parentId: null,
            depth: 0,
            url: item.url || '',
            target: '_self',
            children: [],

            // 🔥 WAJIB ADA (biar tidak error di UI)
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
        <div className="grid grid-cols-12 gap-6">
            {/* LEFT PANEL */}
            <div className="col-span-4">
                <MenuSourcePanel onAdd={handleAdd} />
            </div>

            {/* RIGHT PANEL */}
            <div className="col-span-8">
                <MenuTree data={tree} setData={setTree} locale={locale} />
            </div>
        </div>
    );
}
