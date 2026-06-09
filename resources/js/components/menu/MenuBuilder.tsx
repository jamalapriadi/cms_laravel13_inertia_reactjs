import MenuSourcePanel from './MenuSourcePanel';
import MenuTree from './MenuTree';

function getDefaultMeta(type: string) {
    if (type === 'dropdown') {
        return {
            dropdown_layout: 'mega_menu',
            columns: 4,
        };
    }

    if (type === 'dynamic') {
        return {
            source: 'products',
            filter: {
                category_id: null,
            },
            limit: 6,
            sort: 'latest',
            layout: 'product_grid',
            show_image: true,
            show_price: true,
            show_excerpt: false,
            cta_label: '',
            cta_url: '',
        };
    }

    return {};
}

export default function MenuBuilder({ tree, setTree, locale, productCategories }: any) {
    function handleAdd(item: any) {
        const type = item.type || 'custom';

        const newItem = {
            id: `temp-${Date.now()}`,
            parentId: null,
            depth: 0,
            url: item.url || '',
            type,
            target: '_self',
            icon: null,
            meta: item.meta || getDefaultMeta(type),
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
                <MenuTree
                    data={tree}
                    setData={setTree}
                    locale={locale}
                    productCategories={productCategories}
                />
            </div>
        </div>
    );
}
