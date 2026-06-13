import { Head } from '@inertiajs/react';

// import AppLayout from '@/layouts/master-data-layout';

import SupplierReturnForm, {
    StockUnitOption,
    SupplierOption,
    SupplierReturnFormData,
} from './Form';

interface SupplierReturnRecord {
    id: string;
    supplier_id: string;
    return_number: string;
    return_date: string;
    status: 'pending' | 'completed' | 'cancelled';
    note?: string | null;
    items: Array<{
        product_stock_unit_id: string;
        notes?: string | null;
    }>;
}

interface Props {
    supplierReturn: SupplierReturnRecord;
    suppliers: SupplierOption[];
    stockUnits: StockUnitOption[];
}

export default function Edit({ supplierReturn, suppliers, stockUnits }: Props) {
    const initialData: SupplierReturnFormData = {
        supplier_id: supplierReturn.supplier_id,
        return_number: supplierReturn.return_number,
        return_date: supplierReturn.return_date.slice(0, 10),
        status: supplierReturn.status,
        note: supplierReturn.note ?? '',
        items: supplierReturn.items.map((item) => ({
            product_stock_unit_id: item.product_stock_unit_id,
            notes: item.notes ?? '',
        })),
    };

    return (
        <>
            <Head title="Edit Retur Barang" />
            <SupplierReturnForm
                suppliers={suppliers}
                stockUnits={stockUnits}
                initialData={initialData}
                submitUrl={`/my-admin/dashboard/ecommerce/supplier-returns/${supplierReturn.id}`}
                method="put"
                title="Edit Retur Barang"
                description="Ubah draft retur barang sebelum transaksi diselesaikan."
            />
        </>
    );
}
