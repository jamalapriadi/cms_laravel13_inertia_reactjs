import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

import MediaImagePicker from '@/components/media/MediaImagePicker';
import SearchableSelect from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/master-data-layout';

interface Product {
    id: string;
    name: string;
}

interface Combination {
    name: string;
    option_ids: string[];
}

interface VariantItemDraft extends Combination {
    sku: string;
    image: string | null;
    buying_price: number;
    selling_price: number;
    stock: number;
    weight: number | null;
    is_active: boolean;
}

interface Props {
    products: Product[];
    product?: Product | null;
    combinations: Combination[];
}

export default function Create({ products, product, combinations }: Props) {
    const [productId, setProductId] = useState(product?.id ?? '');
    const [items, setItems] = useState<VariantItemDraft[]>(
        combinations.map((combination, index) => ({
            ...combination,
            sku: '',
            image: null,
            buying_price: 0,
            selling_price: 0,
            stock: 0,
            weight: null,
            is_active: true,
        })),
    );
    const [processing, setProcessing] = useState(false);

    const updateItem = <K extends keyof VariantItemDraft>(
        index: number,
        key: K,
        value: VariantItemDraft[K],
    ) => {
        setItems((drafts) =>
            drafts.map((draft, itemIndex) =>
                itemIndex === index ? { ...draft, [key]: value } : draft,
            ),
        );
    };

    const loadCombinations = () => {
        if (productId) {
            router.get('/my-admin/dashboard/ecommerce/variant-items/create', {
                product_id: productId,
            });
        }
    };

    const submit = () => {
        router.post(
            '/my-admin/dashboard/ecommerce/variant-items',
            {
                product_id: productId,
                items,
            } as unknown as Record<string, never>,
            {
                preserveScroll: true,
                onStart: () => {
                    setProcessing(true);
                    toast.loading('Saving variant items...', {
                        id: 'variant-items',
                    });
                },
                onSuccess: () => {
                    toast.success('Variant items saved successfully.', {
                        id: 'variant-items',
                    });
                },
                onError: () => {
                    toast.error('Please check SKU, price, and stock fields.', {
                        id: 'variant-items',
                    });
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Create Variant Items" />

            <div className="container mx-auto space-y-8 px-6 py-10">
                <div>
                    <h1 className="text-2xl font-bold">Create Variant Items</h1>
                    <p className="text-muted-foreground">
                        Buat SKU combination dari semua opsi variant produk.
                    </p>
                </div>

                <div className="flex flex-wrap items-end gap-3 rounded-lg bg-card p-6 shadow">
                    <div className="flex min-w-72 flex-col gap-2">
                        <Label>Product</Label>
                        <SearchableSelect
                            options={products.map((item) => ({
                                value: item.id,
                                label: item.name,
                            }))}
                            value={productId}
                            onChange={(value) => setProductId(value ?? '')}
                            placeholder="-- Select Product --"
                        />
                    </div>
                    <Button type="button" onClick={loadCombinations}>
                        Load Combinations
                    </Button>
                </div>

                {items.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border bg-card shadow">
                        <table className="w-full min-w-240 text-sm">
                            <thead className="border-b bg-muted/60 text-left">
                                <tr>
                                    <th className="p-3">Product Variant</th>
                                    <th className="p-3">Image</th>
                                    <th className="p-3">SKU</th>
                                    <th className="p-3">Buying Price</th>
                                    <th className="p-3">Selling Price</th>
                                    <th className="p-3">Stock</th>
                                    <th className="p-3">Weight</th>
                                    <th className="p-3">Active</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="p-3 font-medium">
                                            {item.name}
                                        </td>
                                        <td className="w-48 p-3">
                                            <MediaImagePicker
                                                value={item.image}
                                                onChange={(path) =>
                                                    updateItem(
                                                        index,
                                                        'image',
                                                        path,
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="p-3">
                                            <Input
                                                value={item.sku}
                                                onChange={(event) =>
                                                    updateItem(
                                                        index,
                                                        'sku',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="p-3">
                                            <Input
                                                type="number"
                                                min="0"
                                                value={item.buying_price}
                                                onChange={(event) =>
                                                    updateItem(
                                                        index,
                                                        'buying_price',
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="p-3">
                                            <Input
                                                type="number"
                                                min="0"
                                                value={item.selling_price}
                                                onChange={(event) =>
                                                    updateItem(
                                                        index,
                                                        'selling_price',
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="p-3">
                                            <Input
                                                type="number"
                                                min="0"
                                                value={item.stock}
                                                onChange={(event) =>
                                                    updateItem(
                                                        index,
                                                        'stock',
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="p-3">
                                            <Input
                                                type="number"
                                                min="0"
                                                value={item.weight ?? ''}
                                                onChange={(event) =>
                                                    updateItem(
                                                        index,
                                                        'weight',
                                                        event.target.value
                                                            ? Number(
                                                                  event.target
                                                                      .value,
                                                              )
                                                            : null,
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="p-3">
                                            <Checkbox
                                                checked={item.is_active}
                                                onCheckedChange={(checked) =>
                                                    updateItem(
                                                        index,
                                                        'is_active',
                                                        Boolean(checked),
                                                    )
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex justify-end">
                    <Button
                        type="button"
                        disabled={
                            processing || !productId || items.length === 0
                        }
                        onClick={submit}
                    >
                        Save Variant Items
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
