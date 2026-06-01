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

export interface StockUnitOption {
    id: string;
    imei_serial_number: string;
    network_compatibility?: string | null;
    product_name: string;
    variant_name: string;
    sku: string;
}

export interface SupplierReturnItemInput {
    product_stock_unit_id: string;
    notes: string;
}

export interface SupplierReturnFormData {
    supplier_id: string;
    return_number: string;
    return_date: string;
    status: 'pending' | 'completed' | 'cancelled';
    note: string;
    items: SupplierReturnItemInput[];
}

interface Props {
    suppliers: SupplierOption[];
    stockUnits: StockUnitOption[];
    initialData?: SupplierReturnFormData;
    submitUrl: string;
    method: 'post' | 'put';
    title: string;
    description: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const emptyItem = (): SupplierReturnItemInput => ({
    product_stock_unit_id: '',
    notes: '',
});

export default function SupplierReturnForm({
    suppliers,
    stockUnits,
    initialData,
    submitUrl,
    method,
    title,
    description,
}: Props) {
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState<SupplierReturnFormData>(
        initialData ?? {
            supplier_id: '',
            return_number: '',
            return_date: today(),
            status: 'pending',
            note: '',
            items: [emptyItem()],
        },
    );

    const stockUnitById = useMemo(
        () => new Map(stockUnits.map((unit) => [unit.id, unit])),
        [stockUnits],
    );

    const selectedUnitIds = form.items
        .map((item) => item.product_stock_unit_id)
        .filter(Boolean);

    const updateForm = <K extends keyof SupplierReturnFormData>(
        key: K,
        value: SupplierReturnFormData[K],
    ) => setForm((current) => ({ ...current, [key]: value }));

    const updateItem = <K extends keyof SupplierReturnItemInput>(
        index: number,
        key: K,
        value: SupplierReturnItemInput[K],
    ) => {
        setForm((current) => ({
            ...current,
            items: current.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [key]: value } : item,
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
                toast.loading('Menyimpan retur supplier...', {
                    id: 'return-save',
                });
            },
            onSuccess: () => {
                toast.success('Retur supplier berhasil disimpan.', {
                    id: 'return-save',
                });
            },
            onError: () => {
                toast.error('Gagal menyimpan. Periksa kembali input retur.', {
                    id: 'return-save',
                });
            },
            onFinish: () => setProcessing(false),
        };

        if (method === 'post') {
            router.post(submitUrl, form as unknown as RequestPayload, options);

            return;
        }

        router.put(submitUrl, form as unknown as RequestPayload, options);
    };

    return (
        <div className="container mx-auto space-y-8 px-6 py-8">
            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                        router.visit('/dashboard/ecommerce/supplier-returns')
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
                        <Label>Nomor Retur</Label>
                        <Input
                            value={form.return_number}
                            onChange={(event) =>
                                updateForm('return_number', event.target.value)
                            }
                            placeholder="RTR-SPL-0001"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label>Tanggal Retur</Label>
                        <Input
                            type="date"
                            value={form.return_date}
                            onChange={(event) =>
                                updateForm('return_date', event.target.value)
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
                                        .value as SupplierReturnFormData['status'],
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
                            placeholder="Alasan atau catatan retur ke supplier"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                            Barang Rusak / Diretur
                        </h2>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addItem}
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Barang
                        </Button>
                    </div>

                    {form.items.map((item, index) => {
                        const currentUnit = stockUnitById.get(
                            item.product_stock_unit_id,
                        );

                        return (
                            <div
                                key={index}
                                className="grid gap-4 rounded-xl border bg-card p-5 shadow-sm md:grid-cols-[1fr_1fr_auto]"
                            >
                                <div className="flex flex-col gap-1.5">
                                    <Label>Stok Unit</Label>
                                    <SearchableSelect
                                        options={stockUnits.map((unit) => ({
                                            value: unit.id,
                                            label: unit.imei_serial_number,
                                            description: `${unit.product_name} / ${unit.variant_name} (${unit.sku})`,
                                            disabled:
                                                selectedUnitIds.includes(
                                                    unit.id,
                                                ) &&
                                                unit.id !==
                                                    item.product_stock_unit_id,
                                        }))}
                                        value={item.product_stock_unit_id}
                                        onChange={(value) =>
                                            updateItem(
                                                index,
                                                'product_stock_unit_id',
                                                value ?? '',
                                            )
                                        }
                                        placeholder="Pilih IMEI/serial"
                                    />
                                    {currentUnit && (
                                        <p className="text-xs text-muted-foreground">
                                            {currentUnit.product_name} /{' '}
                                            {currentUnit.variant_name} - SKU{' '}
                                            {currentUnit.sku}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label>Keterangan Kerusakan</Label>
                                    <Input
                                        value={item.notes}
                                        onChange={(event) =>
                                            updateItem(
                                                index,
                                                'notes',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="LCD rusak, tidak menyala, dll."
                                    />
                                </div>

                                <div className="flex items-end">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => removeItem(index)}
                                        disabled={form.items.length === 1}
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-between gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            router.visit(
                                '/dashboard/ecommerce/supplier-returns',
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
                        {processing ? 'Menyimpan...' : 'Simpan Retur'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
