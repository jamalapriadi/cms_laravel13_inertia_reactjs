import { Head } from '@inertiajs/react';

// import AppLayout from '@/layouts/master-data-layout';

import IncomingGoodsForm, {
    IncomingGoodsFormData,
    SupplierOption,
    VariantOption,
} from './Form';

interface IncomingGoodsRecord {
    id: string;
    supplier_id: string;
    invoice_number: string;
    transaction_date: string;
    status: 'pending' | 'completed' | 'cancelled';
    note?: string | null;
    items: Array<{
        product_id: string;
        product_variant_id: string;
        qty: number;
        cost_price: number | string;
        stock_units: Array<{
            imei_serial_number: string;
            network_compatibility?: string | null;
        }>;
    }>;
}

interface Props {
    incomingGoods: IncomingGoodsRecord;
    suppliers: SupplierOption[];
    variants: VariantOption[];
    networks: string[];
}

const toDateInput = (value: string) => value.slice(0, 10);

export default function Edit({
    incomingGoods,
    suppliers,
    variants,
    networks,
}: Props) {
    const initialData: IncomingGoodsFormData = {
        supplier_id: incomingGoods.supplier_id,
        invoice_number: incomingGoods.invoice_number,
        transaction_date: toDateInput(incomingGoods.transaction_date),
        status: incomingGoods.status,
        note: incomingGoods.note ?? '',
        items: incomingGoods.items.map((item) => ({
            product_id: item.product_id,
            product_variant_id: item.product_variant_id,
            qty: item.qty,
            cost_price: Number(item.cost_price),
            stock_units: item.stock_units.map((unit) => ({
                imei_serial_number: unit.imei_serial_number,
                network_compatibility: unit.network_compatibility ?? 'sim_free',
            })),
        })),
    };

    return (
        <>
            <Head title="Edit Barang Masuk" />
            <IncomingGoodsForm
                suppliers={suppliers}
                variants={variants}
                networks={networks}
                initialData={initialData}
                submitUrl={`/my-admin/dashboard/ecommerce/incoming-goods/${incomingGoods.id}`}
                method="put"
                title="Edit Barang Masuk"
                description="Ubah draft transaksi barang masuk sebelum diselesaikan."
            />
        </>
    );
}
