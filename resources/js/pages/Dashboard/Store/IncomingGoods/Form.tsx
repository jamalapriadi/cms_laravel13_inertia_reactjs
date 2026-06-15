import type { RequestPayload } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { ArrowLeft, Plus, Save, Trash } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import SearchableSelect from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';

export interface SupplierOption {
    id: string;
    name: string;
}

export interface VariantOption {
    id: string;
    name: string;
    sku: string;
    cost_price: number | string;
    product_id: string;
}

export interface StockUnitInput {
    imei_serial_number: string;
    network_compatibility: string;
}

export interface IncomingGoodsItemInput {
    product_id: string;
    product_variant_id: string;
    qty: number;
    cost_price: number;
    stock_units: StockUnitInput[];
}

export interface IncomingGoodsFormData {
    supplier_id: string;
    invoice_number: string;
    transaction_date: string;
    status: 'pending' | 'completed' | 'cancelled';
    note: string;
    items: IncomingGoodsItemInput[];
}

interface Props {
    suppliers: SupplierOption[];
    variants: VariantOption[];
    networks: string[];
    initialData?: IncomingGoodsFormData;
    submitUrl: string;
    method: 'post' | 'put';
    title: string;
    description: string;
}

const emptyItem = (): IncomingGoodsItemInput => ({
    product_id: '',
    product_variant_id: '',
    qty: 1,
    cost_price: 0,
    stock_units: [
        { imei_serial_number: '', network_compatibility: 'sim_free' },
    ],
});

const today = () => new Date().toISOString().slice(0, 10);

const networkLabel = (network: string) =>
    ({
        sim_free: 'All Operator',
        docomo: 'Docomo',
        au: 'AU',
        softbank: 'SoftBank',
        rakuten: 'Rakuten',
        mineo: 'Mineo',
    })[network] ?? network;

export default function IncomingGoodsForm({
    suppliers,
    variants,
    networks,
    initialData,
    submitUrl,
    method,
    title,
    description,
}: Props) {
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState<IncomingGoodsFormData>(
        initialData ?? {
            supplier_id: '',
            invoice_number: '',
            transaction_date: today(),
            status: 'pending',
            note: '',
            items: [emptyItem()],
        },
    );

    const variantById = useMemo(
        () => new Map(variants.map((variant) => [variant.id, variant])),
        [variants],
    );

    const updateForm = <K extends keyof IncomingGoodsFormData>(
        key: K,
        value: IncomingGoodsFormData[K],
    ) => setForm((current) => ({ ...current, [key]: value }));

    const updateItem = <K extends keyof IncomingGoodsItemInput>(
        index: number,
        key: K,
        value: IncomingGoodsItemInput[K],
    ) => {
        setForm((current) => ({
            ...current,
            items: current.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [key]: value } : item,
            ),
        }));
    };

    const selectVariant = (index: number, variantId: string) => {
        const variant = variantById.get(variantId);

        setForm((current) => ({
            ...current,
            items: current.items.map((item, itemIndex) =>
                itemIndex === index
                    ? {
                          ...item,
                          product_variant_id: variantId,
                          product_id: variant?.product_id ?? '',
                          cost_price: Number(variant?.cost_price ?? 0),
                      }
                    : item,
            ),
        }));
    };

    const updateQty = (index: number, qty: number) => {
        const nextQty = Math.max(1, qty || 1);

        setForm((current) => ({
            ...current,
            items: current.items.map((item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }

                const stockUnits = [...item.stock_units];

                while (stockUnits.length < nextQty) {
                    stockUnits.push({
                        imei_serial_number: '',
                        network_compatibility: 'sim_free',
                    });
                }

                return {
                    ...item,
                    qty: nextQty,
                    stock_units: stockUnits.slice(0, nextQty),
                };
            }),
        }));
    };

    const updateStockUnit = <K extends keyof StockUnitInput>(
        itemIndex: number,
        unitIndex: number,
        key: K,
        value: StockUnitInput[K],
    ) => {
        setForm((current) => ({
            ...current,
            items: current.items.map((item, index) =>
                index === itemIndex
                    ? {
                          ...item,
                          stock_units: item.stock_units.map(
                              (unit, unitPosition) =>
                                  unitPosition === unitIndex
                                      ? { ...unit, [key]: value }
                                      : unit,
                          ),
                      }
                    : item,
            ),
        }));
    };

    const addItem = () => {
        setForm((current) => ({
            ...current,
            items: [...current.items, emptyItem()],
        }));
    };

    const removeItem = (index: number) => {
        setForm((current) => ({
            ...current,
            items:
                current.items.length === 1
                    ? current.items
                    : current.items.filter(
                          (_, itemIndex) => itemIndex !== index,
                      ),
        }));
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onStart: () => {
                setProcessing(true);
                toast.loading('Menyimpan barang masuk...', {
                    id: 'incoming-save',
                });
            },
            onSuccess: () => {
                toast.success('Barang masuk berhasil disimpan.', {
                    id: 'incoming-save',
                });
            },
            onError: () => {
                toast.error(
                    'Gagal menyimpan. Periksa kembali input transaksi.',
                    {
                        id: 'incoming-save',
                    },
                );
            },
            onFinish: () => setProcessing(false),
        };

        if (method === 'post') {
            router.post(submitUrl, form as unknown as RequestPayload, options);

            return;
        }

        router.put(submitUrl, form as unknown as RequestPayload, options);
    };

    const totalAmount = form.items.reduce(
        (total, item) => total + item.qty * Number(item.cost_price || 0),
        0,
    );

    return (
        <div className="container mx-auto space-y-8 px-6 py-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                            router.visit(
                                '/my-admin/dashboard/ecommerce/incoming-goods',
                            )
                        }
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {title}
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="rounded-lg border bg-card px-4 py-2 text-right">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Total
                    </p>
                    <p className="font-bold">
                        {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                        }).format(totalAmount)}
                    </p>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-6">
                <div className="grid gap-5 rounded-xl border bg-card p-6 shadow-sm md:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <Label>Supplier</Label>
                        <SearchableSelect
                            options={suppliers.map((supplier) => ({
                                value: supplier.id,
                                label: supplier.name,
                            }))}
                            value={form.supplier_id}
                            onChange={(value) =>
                                updateForm('supplier_id', value ?? '')
                            }
                            placeholder="Pilih supplier"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label>Nomor Invoice</Label>
                        <Input
                            value={form.invoice_number}
                            onChange={(event) =>
                                updateForm('invoice_number', event.target.value)
                            }
                            placeholder="INV-SPL-0001"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label>Tanggal Transaksi</Label>
                        <Input
                            type="date"
                            value={form.transaction_date}
                            onChange={(event) =>
                                updateForm(
                                    'transaction_date',
                                    event.target.value,
                                )
                            }
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label>Status</Label>
                        <select
                            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={form.status}
                            onChange={(event) =>
                                updateForm(
                                    'status',
                                    event.target
                                        .value as IncomingGoodsFormData['status'],
                                )
                            }
                        >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <Label>Catatan</Label>
                        <Textarea
                            className="mt-1"
                            value={form.note}
                            onChange={(event) =>
                                updateForm('note', event.target.value)
                            }
                            rows={3}
                            placeholder="Catatan pembelian dari supplier"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Detail Barang</h2>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addItem}
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Item
                        </Button>
                    </div>

                    {form.items.map((item, itemIndex) => (
                        <div
                            key={itemIndex}
                            className="space-y-5 rounded-xl border bg-card p-5 shadow-sm"
                        >
                            <div className="grid gap-4 md:grid-cols-[1fr_120px_180px_auto]">
                                <div className="flex flex-col gap-1.5">
                                    <Label>Produk Variant</Label>
                                    <SearchableSelect
                                        options={variants.map((variant) => ({
                                            value: variant.id,
                                            label: variant.name,
                                            description: variant.sku,
                                        }))}
                                        value={item.product_variant_id}
                                        onChange={(value) =>
                                            selectVariant(
                                                itemIndex,
                                                value ?? '',
                                            )
                                        }
                                        placeholder="Pilih variant"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label>Qty</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={item.qty}
                                        onChange={(event) =>
                                            updateQty(
                                                itemIndex,
                                                Number(event.target.value),
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label>Harga Modal</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={item.cost_price}
                                        onChange={(event) =>
                                            updateItem(
                                                itemIndex,
                                                'cost_price',
                                                Number(event.target.value),
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div className="flex items-end">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => removeItem(itemIndex)}
                                        disabled={form.items.length === 1}
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm font-medium">
                                    IMEI / Serial Number
                                </p>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {item.stock_units.map((unit, unitIndex) => (
                                        <div
                                            key={unitIndex}
                                            className="grid gap-3 rounded-lg border bg-muted/30 p-3 md:grid-cols-[1fr_160px]"
                                        >
                                            <Input
                                                value={unit.imei_serial_number}
                                                onChange={(event) =>
                                                    updateStockUnit(
                                                        itemIndex,
                                                        unitIndex,
                                                        'imei_serial_number',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder={`Serial ${unitIndex + 1}`}
                                                required
                                            />
                                            <select
                                                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={
                                                    unit.network_compatibility
                                                }
                                                onChange={(event) =>
                                                    updateStockUnit(
                                                        itemIndex,
                                                        unitIndex,
                                                        'network_compatibility',
                                                        event.target.value,
                                                    )
                                                }
                                            >
                                                {networks.map((network) => (
                                                    <option
                                                        key={network}
                                                        value={network}
                                                    >
                                                        {networkLabel(network)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            router.visit(
                                '/my-admin/dashboard/ecommerce/incoming-goods',
                            )
                        }
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {processing ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
