import { Head } from '@inertiajs/react';

// import AppLayout from '@/layouts/master-data-layout';

import IncomingGoodsForm, { SupplierOption, VariantOption } from './Form';

interface Props {
    suppliers: SupplierOption[];
    variants: VariantOption[];
}

export default function Create({ suppliers, variants }: Props) {
    return (
        <>
            <Head title="Tambah Barang Masuk" />
            <IncomingGoodsForm
                suppliers={suppliers}
                variants={variants}
                submitUrl="/my-admin/dashboard/ecommerce/incoming-goods"
                method="post"
                title="Tambah Barang Masuk"
                description="Catat pembelian produk dari supplier dan daftarkan serial stok unit."
            />
        </>
    );
}
