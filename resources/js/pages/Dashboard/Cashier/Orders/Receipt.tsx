import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface Props {
    order: any;
}

export default function CashierReceipt({ order }: Props) {
    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount));
    };

    useEffect(() => {
        // Automatically open print dialog after a short delay
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <Head title={`Struk - ${order.invoice_number}`} />
            
            <div className="min-h-screen bg-neutral-100 flex items-start justify-center p-4 print:p-0 print:bg-white">
                
                {/* Print Action Header (Hidden on Print) */}
                <div className="fixed top-4 right-4 print:hidden">
                    <Button onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" /> Cetak
                    </Button>
                </div>

                {/* Receipt Paper */}
                <div className="w-[80mm] bg-white shadow-md print:shadow-none p-4 text-[12px] leading-tight text-black font-mono">
                    
                    {/* Header */}
                    <div className="text-center space-y-1 mb-4">
                        <h1 className="text-lg font-bold">GITA TRADING STORE</h1>
                        <p className="text-[10px]">Jl. Contoh Alamat Toko No. 123</p>
                        <p className="text-[10px]">Telp: 081234567890</p>
                    </div>

                    <div className="border-b border-dashed border-gray-400 mb-2"></div>
                    
                    <div className="flex justify-between mb-1">
                        <span>No:</span>
                        <span>{order.invoice_number}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span>Tgl:</span>
                        <span>{new Date(order.created_at).toLocaleString('id-ID', {
                            year: 'numeric', month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute:'2-digit'
                        })}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span>Kasir:</span>
                        <span>{order.cashier?.name || 'Sistem'}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span>Pelanggan:</span>
                        <span>{order.customer_name || 'Umum'}</span>
                    </div>

                    <div className="border-b border-dashed border-gray-400 mb-2"></div>

                    {/* Items */}
                    <div className="space-y-2 mb-2">
                        {order.items.map((item: any) => (
                            <div key={item.id} className="flex flex-col">
                                <div>
                                    {item.product_name} 
                                    {item.variant_name && ` - ${item.variant_name}`}
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span>
                                        {item.qty} x {formatCurrency(item.price)}
                                        {item.is_price_overridden && (
                                            <span className="block text-[8px] text-gray-500 line-through">
                                                Normal: {formatCurrency(item.original_unit_price || 0)}
                                            </span>
                                        )}
                                    </span>
                                    <span>{formatCurrency(item.subtotal)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-b border-dashed border-gray-400 mb-2"></div>

                    {/* Totals */}
                    <div className="space-y-1 mb-2">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        {order.discount > 0 && (
                            <div className="flex justify-between">
                                <span>Diskon</span>
                                <span>-{formatCurrency(order.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-sm mt-1">
                            <span>Total</span>
                            <span>{formatCurrency(order.grand_total)}</span>
                        </div>
                    </div>

                    <div className="border-b border-dashed border-gray-400 mb-2"></div>

                    {/* Payment Info */}
                    <div className="space-y-1 mb-4">
                        <div className="flex justify-between">
                            <span>Tunai ({order.payment_method?.replace('_', ' ')})</span>
                            <span>{formatCurrency(order.amount_paid)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Kembali</span>
                            <span>{formatCurrency(order.change_amount)}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center space-y-1 mt-6">
                        <p>Terima kasih atas kunjungan Anda!</p>
                        <p className="text-[10px]">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
                    </div>

                </div>
            </div>
        </>
    );
}

// Ensure no admin layout is applied for printing
CashierReceipt.layout = (page: any) => page;
