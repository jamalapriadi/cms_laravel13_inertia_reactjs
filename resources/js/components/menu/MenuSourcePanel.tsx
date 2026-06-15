import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function MenuSourcePanel({
    onAdd,
}: {
    onAdd: (item: {
        title: string;
        url?: string;
        type?: string;
        meta?: Record<string, any>;
    }) => void;
}) {
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');

    function addCustomLink() {
        if (!title) {
            return;
        }

        onAdd({
            title,
            url,
        });

        setTitle('');
        setUrl('');
    }

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <h2 className="font-semibold">Custom Link</h2>

            <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <Input
                placeholder="URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
            />

            <Button onClick={addCustomLink}>Add to Menu</Button>

            <div className="border-t pt-4">
                <h3 className="font-semibold">Quick Add</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Tambahkan container dropdown atau blok dynamic, lalu
                    sesuaikan detailnya di editor item.
                </p>

                <div className="mt-3 grid gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            onAdd({
                                title: 'Dropdown Menu',
                                type: 'dropdown',
                                meta: {
                                    dropdown_layout: 'mega_menu',
                                    columns: 4,
                                },
                            })
                        }
                    >
                        Add Dropdown
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            onAdd({
                                title: 'Dynamic Products',
                                type: 'dynamic_products',
                                meta: {
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
                                },
                            })
                        }
                    >
                        Add Dynamic Products
                    </Button>
                </div>
            </div>
        </div>
    );
}
