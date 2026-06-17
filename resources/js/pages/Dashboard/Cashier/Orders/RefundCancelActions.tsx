import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import { router } from '@inertiajs/react';
import { Ban, RefreshCcw, MoreVertical, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    order: any;
}

export function RefundCancelActions({ order }: Props) {
    const [actionType, setActionType] = useState<'cancel' | 'full_refund' | 'partial_refund' | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // Form state
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    const [items, setItems] = useState<any[]>([]);

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount));
    };

    const handleOpenDialog = (type: 'cancel' | 'full_refund' | 'partial_refund') => {
        setActionType(type);
        setReason('');
        setNote('');
        
        if (type === 'partial_refund') {
            // Initialize items with 0 quantity
            setItems(order.items.map((item: any) => ({
                order_item_id: item.id,
                name: item.product_name,
                price: item.price,
                max_qty: item.qty, // Note: backend should tell us available qty if partially refunded before
                quantity: 0,
            })));
        }
        
        setIsDialogOpen(true);
    };

    const handleQuantityChange = (orderItemId: string, qty: number) => {
        setItems(items.map(item => 
            item.order_item_id === orderItemId 
                ? { ...item, quantity: Math.min(Math.max(0, qty), item.max_qty) } 
                : item
        ));
    };

    const handleSubmit = () => {
        if (!reason.trim()) {
            toast.error('Alasan harus diisi.');
            return;
        }

        let route = '';
        let data: any = { reason, note };

        if (actionType === 'cancel') {
            route = `/my-admin/dashboard/cashier/orders/${order.id}/cancel`;
        } else if (actionType === 'full_refund') {
            route = `/my-admin/dashboard/cashier/orders/${order.id}/refund/full`;
        } else if (actionType === 'partial_refund') {
            route = `/my-admin/dashboard/cashier/orders/${order.id}/refund/partial`;
            const selectedItems = items.filter(item => item.quantity > 0);
            if (selectedItems.length === 0) {
                toast.error('Pilih minimal 1 item untuk diretur.');
                return;
            }
            data.items = selectedItems;
        }

        router.post(route, data, {
            onSuccess: () => {
                setIsDialogOpen(false);
                toast.success('Aksi berhasil dilakukan.');
            },
            onError: (errors) => {
                toast.error(errors.message || 'Terjadi kesalahan.');
            }
        });
    };

    if (order.status === 'cancelled' || order.status === 'refunded') {
        return null; // Cannot perform actions if already fully refunded or cancelled
    }

    const totalPartialRefund = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {order.status !== 'completed' && order.status !== 'partially_refunded' && (
                        <DropdownMenuItem onClick={() => handleOpenDialog('cancel')}>
                            <Ban className="mr-2 h-4 w-4 text-destructive" />
                            <span className="text-destructive">Batalkan Order</span>
                        </DropdownMenuItem>
                    )}
                    {(order.status === 'completed' || order.status === 'partially_refunded') && (
                        <>
                            <DropdownMenuItem onClick={() => handleOpenDialog('full_refund')}>
                                <RefreshCcw className="mr-2 h-4 w-4 text-orange-500" />
                                <span className="text-orange-500">Refund Penuh</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenDialog('partial_refund')}>
                                <RefreshCcw className="mr-2 h-4 w-4 text-yellow-600" />
                                <span className="text-yellow-600">Refund / Retur Sebagian</span>
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className={actionType === 'partial_refund' ? 'max-w-2xl' : ''}>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === 'cancel' && 'Batalkan Order'}
                            {actionType === 'full_refund' && 'Refund Penuh'}
                            {actionType === 'partial_refund' && 'Refund / Retur Sebagian'}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === 'cancel' && 'Apakah Anda yakin ingin membatalkan order ini? Stok akan dikembalikan dan order tidak bisa dipulihkan.'}
                            {actionType === 'full_refund' && 'Order akan direfund penuh dan stok akan dikembalikan.'}
                            {actionType === 'partial_refund' && 'Pilih item yang ingin diretur.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {actionType === 'partial_refund' && (
                            <div className="border rounded-md p-4 space-y-4 max-h-[300px] overflow-y-auto">
                                {items.map((item) => (
                                    <div key={item.order_item_id} className="flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} x {item.max_qty} dibeli</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Input 
                                                type="number" 
                                                min="0" 
                                                max={item.max_qty} 
                                                value={item.quantity}
                                                onChange={(e) => handleQuantityChange(item.order_item_id, parseInt(e.target.value) || 0)}
                                                className="w-20 text-center"
                                            />
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-4 border-t flex justify-between font-medium">
                                    <span>Total Estimasi Refund:</span>
                                    <span>{formatCurrency(totalPartialRefund)}</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Alasan <span className="text-destructive">*</span></Label>
                            <Input 
                                value={reason} 
                                onChange={(e) => setReason(e.target.value)} 
                                placeholder="Misal: Customer batal beli" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Catatan Tambahan (Opsional)</Label>
                            <Textarea 
                                value={note} 
                                onChange={(e) => setNote(e.target.value)} 
                                placeholder="Catatan internal..." 
                            />
                        </div>

                        {actionType === 'cancel' && (
                            <div className="bg-destructive/10 text-destructive p-3 rounded-md flex gap-2 items-start text-sm">
                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                <p>Pastikan fisik barang sudah kembali atau tidak jadi diserahkan ke pelanggan.</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                        <Button 
                            variant={actionType === 'cancel' ? 'destructive' : 'default'} 
                            onClick={handleSubmit}
                        >
                            Konfirmasi {actionType === 'cancel' ? 'Batal' : 'Refund'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
