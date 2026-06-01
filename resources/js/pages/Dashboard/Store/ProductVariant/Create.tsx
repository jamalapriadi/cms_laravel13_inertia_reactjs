import { Head, router } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
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

interface VariantDraft {
    name: string;
    optionsText: string;
}

interface Props {
    products: Product[];
    selectedProductId?: string | null;
}

export default function Create({ products = [], selectedProductId }: Props) {
    const productOptions = Array.isArray(products) ? products : [];
    const [productId, setProductId] = useState(selectedProductId ?? '');
    const [variants, setVariants] = useState<VariantDraft[]>([
        { name: '', optionsText: '' },
    ]);
    const [processing, setProcessing] = useState(false);

    const payload = useMemo(
        () => ({
            product_id: productId,
            variants: variants
                .map((variant) => ({
                    name: variant.name.trim(),
                    options: variant.optionsText
                        .split('\n')
                        .map((option) => option.trim())
                        .filter(Boolean),
                }))
                .filter(
                    (variant) =>
                        variant.name !== '' && variant.options.length > 0,
                ),
        }),
        [productId, variants],
    );

    const updateVariant = (
        index: number,
        key: keyof VariantDraft,
        value: string,
    ) => {
        setVariants((items) =>
            items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [key]: value } : item,
            ),
        );
    };

    const submit = () => {
        router.post('/dashboard/ecommerce/product-variants', payload, {
            preserveScroll: true,
            onStart: () => {
                setProcessing(true);
                toast.loading('Saving variants...', { id: 'variants' });
            },
            onSuccess: () => {
                toast.success('Variants saved successfully.', {
                    id: 'variants',
                });
            },
            onError: () => {
                toast.error('Please check variant names and options.', {
                    id: 'variants',
                });
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout>
            <Head title="Create Product Variants" />

            <div className="container mx-auto space-y-8 px-6 py-10">
                <div>
                    <h1 className="text-2xl font-bold">
                        Create Product Variants
                    </h1>
                    <p className="text-muted-foreground">
                        Tambahkan jenis variant dan opsi untuk produk.
                    </p>
                </div>

                <div className="space-y-6 rounded-lg bg-card p-6 shadow">
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

                    <div className="space-y-4">
                        {variants.map((variant, index) => (
                            <div
                                key={index}
                                className="grid gap-4 rounded-lg border bg-background p-4 md:grid-cols-[1fr_1.5fr_auto]"
                            >
                                <div className="flex flex-col gap-2">
                                    <Label>Variant Name</Label>
                                    <Input
                                        value={variant.name}
                                        placeholder="Warna"
                                        onChange={(event) =>
                                            updateVariant(
                                                index,
                                                'name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Options</Label>
                                    <textarea
                                        className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={variant.optionsText}
                                        placeholder={'Green\nYellow'}
                                        onChange={(event) =>
                                            updateVariant(
                                                index,
                                                'optionsText',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="destructive"
                                        disabled={variants.length === 1}
                                        onClick={() =>
                                            setVariants((items) =>
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
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap justify-between gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                                setVariants((items) => [
                                    ...items,
                                    { name: '', optionsText: '' },
                                ])
                            }
                        >
                            <Plus className="h-4 w-4" />
                            Add Variant
                        </Button>
                        <Button
                            type="button"
                            disabled={
                                processing ||
                                !payload.product_id ||
                                payload.variants.length === 0
                            }
                            onClick={submit}
                        >
                            Save Variants
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
