import { Head, router } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import SearchableSelect from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/master-data-layout';

interface Product {
    id: string;
    name: string;
}

interface ProductVariantOption {
    id: string;
    value: string;
}

interface ProductVariant {
    id: string;
    product_id: string;
    name: string;
    options?: ProductVariantOption[];
}

interface Props {
    variant: ProductVariant;
    products: Product[];
}

export default function Edit({ variant, products = [] }: Props) {
    const productOptions = Array.isArray(products) ? products : [];
    const [productId, setProductId] = useState(variant.product_id);
    const [name, setName] = useState(variant.name);
    const [options, setOptions] = useState<string[]>(
        (variant.options ?? []).map((option) => option.value),
    );
    const [processing, setProcessing] = useState(false);

    const submit = () => {
        router.put(
            `/my-admin/dashboard/ecommerce/product-variants/${variant.id}`,
            {
                product_id: productId,
                name,
                options: options.map((option) => option.trim()).filter(Boolean),
            },
            {
                preserveScroll: true,
                onStart: () => {
                    setProcessing(true);
                    toast.loading('Updating variant...', { id: 'variant' });
                },
                onSuccess: () => {
                    toast.success('Variant updated successfully.', {
                        id: 'variant',
                    });
                },
                onError: () => {
                    toast.error('Please check the variant data.', {
                        id: 'variant',
                    });
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Edit Product Variant" />

            <div className="container mx-auto space-y-8 px-6 py-10">
                <div>
                    <h1 className="text-2xl font-bold">Edit Product Variant</h1>
                    <p className="text-muted-foreground">
                        Update variant type and its options.
                    </p>
                </div>

                <div className="space-y-6 rounded-lg bg-card p-6 shadow">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label>Product</Label>
                            <SearchableSelect
                                options={productOptions.map((product) => ({
                                    value: product.id,
                                    label: product.name,
                                }))}
                                value={productId}
                                onChange={(value) => setProductId(value ?? '')}
                                placeholder="-- Select Product --"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Variant Name</Label>
                            <Input
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Options</Label>
                        {options.map((option, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                    value={option}
                                    onChange={(event) =>
                                        setOptions((items) =>
                                            items.map((item, itemIndex) =>
                                                itemIndex === index
                                                    ? event.target.value
                                                    : item,
                                            ),
                                        )
                                    }
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="destructive"
                                    disabled={options.length === 1}
                                    onClick={() =>
                                        setOptions((items) =>
                                            items.filter(
                                                (_, itemIndex) =>
                                                    itemIndex !== index,
                                            ),
                                        )
                                    }
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap justify-between gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                                setOptions((items) => [...items, ''])
                            }
                        >
                            <Plus className="h-4 w-4" />
                            Add Option
                        </Button>
                        <Button
                            type="button"
                            disabled={processing || !productId || !name}
                            onClick={submit}
                        >
                            Update Variant
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
