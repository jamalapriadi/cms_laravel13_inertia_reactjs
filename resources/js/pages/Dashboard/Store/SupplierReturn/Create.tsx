import { Head } from '@inertiajs/react';

// import AppLayout from '@/layouts/master-data-layout';

import SupplierReturnForm, { StockUnitOption, SupplierOption } from './Form';

interface Props {
    suppliers: SupplierOption[];
    stockUnits: StockUnitOption[];
}

export default function Create({ suppliers, stockUnits }: Props) {
    return (
        <>
            <Head title="Tambah Retur Barang" />
            <SupplierReturnForm
                suppliers={suppliers}
                stockUnits={stockUnits}
                submitUrl="/dashboard/ecommerce/supplier-returns"
                method="post"
                title="Tambah Retur Barang"
                description="Catat barang rusak yang dikembalikan ke supplier."
            />
        </>
    );
}
