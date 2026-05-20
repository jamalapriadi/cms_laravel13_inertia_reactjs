import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/master-data-layout';
import { Button } from '@/components/ui/button';
import { 
    ArrowLeft, 
    Truck, 
    Calendar, 
    MapPin, 
    FileText, 
    Printer, 
    ExternalLink, 
    AlertTriangle,
    CheckCircle2,
    Clock,
    Compass,
    PackageOpen
} from 'lucide-react';

interface OrderOption {
    id: string;
    invoice_number: string;
    customer_name: string;
    shipping_cost: number;
    shipping_address: string | null;
}

interface Shipping {
    id: string;
    order_id: string;
    courier: string;
    tracking_number: string | null;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'failed' | 'returned';
    shipping_cost: number;
    shipping_address: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
    created_at: string;
    order?: OrderOption;
}

interface Props {
    shipping: Shipping;
}

export default function Show({ shipping }: Props) {
    const handlePrintReceipt = () => {
        window.open(`/dashboard/orders/${shipping.order_id}/receipt`, '_blank');
    };

    const getStatusStep = () => {
        switch (shipping.status) {
            case 'pending':
                return 1;
            case 'processing':
                return 2;
            case 'shipped':
                return 3;
            case 'delivered':
                return 4;
            default:
                return 0; // failed or returned
        }
    };

    const timelineSteps = [
        { label: 'Pending', desc: 'Shipment created', step: 1, icon: Clock },
        { label: 'Processing', desc: 'Packing & sorting', step: 2, icon: PackageOpen },
        { label: 'Shipped', desc: 'Dispatched in transit', step: 3, icon: Compass },
        { label: 'Delivered', desc: 'Received at destination', step: 4, icon: CheckCircle2 },
    ];

    const currentStep = getStatusStep();

    return (
        <AppLayout>
            <Head title={`Shipment Details - ${shipping.courier}`} />

            <div className="container mx-auto max-w-5xl space-y-8 px-6 py-8">
                {/* HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/ecommerce/shipping">
                            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">
                                {shipping.courier} Shipment
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Resi / Airway Bill: <span className="font-mono font-semibold">{shipping.tracking_number || 'N/A'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href={`/dashboard/ecommerce/shipping/${shipping.id}/edit`}>
                            <Button variant="outline">Edit Details</Button>
                        </Link>
                        <Button onClick={handlePrintReceipt} className="flex items-center gap-2">
                            <Printer className="w-4 h-4" />
                            Print Receipt / Resi
                        </Button>
                    </div>
                </div>

                <hr className="border-border" />

                {/* DANGER BANNERS FOR ERROR STATES */}
                {shipping.status === 'failed' && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-rose-800 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold">Shipment Delivery Failed</h4>
                            <p className="text-sm text-rose-700 mt-0.5">
                                This shipment could not be successfully delivered. Please check the destination address or contact the carrier.
                            </p>
                        </div>
                    </div>
                )}

                {shipping.status === 'returned' && (
                    <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 text-orange-800 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold">Shipment Returned to Sender</h4>
                            <p className="text-sm text-orange-700 mt-0.5">
                                This shipment has been returned back to the warehouse by the courier.
                            </p>
                        </div>
                    </div>
                )}

                {/* DELIVERY TIMELINE */}
                {currentStep > 0 && (
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h3 className="font-bold text-foreground mb-6">Delivery Progress</h3>
                        <div className="relative flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">
                            {/* Connector Line */}
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 hidden md:block z-0" />
                            
                            {timelineSteps.map((step) => {
                                const StepIcon = step.icon;
                                const isCompleted = currentStep >= step.step;
                                const isCurrent = currentStep === step.step;

                                return (
                                    <div key={step.step} className="flex flex-row md:flex-col items-center gap-4 md:gap-2.5 z-10 w-full md:w-auto">
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                                            isCompleted 
                                                ? 'bg-primary border-primary text-primary-foreground font-bold'
                                                : 'bg-background border-slate-300 text-slate-400'
                                        } ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}`}>
                                            <StepIcon className="w-5 h-5" />
                                        </div>
                                        <div className="text-left md:text-center">
                                            <h4 className={`text-sm font-bold ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {step.label}
                                            </h4>
                                            <p className="text-xs text-muted-foreground">{step.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* INFORMATION GRID */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* LEFT TWO COLUMNS: DETAILS */}
                    <div className="md:col-span-2 space-y-6">
                        {/* SHIPMENT INFO CARD */}
                        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <Truck className="w-4 h-4 text-primary" />
                                Shipment Specifications
                            </h3>
                            <hr className="border-border" />
                            
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground block">Courier Service</span>
                                    <span className="text-sm font-semibold text-foreground uppercase">{shipping.courier}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground block">Tracking Resi Number</span>
                                    <span className="text-sm font-mono font-semibold text-foreground">{shipping.tracking_number || '-'}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground block">Logistic Shipping Cost</span>
                                    <span className="text-sm font-semibold text-foreground">Rp {Number(shipping.shipping_cost).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground block">Current Status</span>
                                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold uppercase text-indigo-700 border border-indigo-200">
                                        {shipping.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* DESTINATION ADDRESS CARD */}
                        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                Delivery Destination
                            </h3>
                            <hr className="border-border" />
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground block">Recipient Address</span>
                                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                                    {shipping.shipping_address || 'No shipping address provided.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: ASSOCIATED ORDER */}
                    <div className="space-y-6">
                        {/* ORDER METADATA */}
                        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Associated Order
                            </h3>
                            <hr className="border-border" />

                            <div className="space-y-3">
                                <div className="space-y-0.5">
                                    <span className="text-xs text-muted-foreground block">Invoice Number</span>
                                    <span className="text-sm font-semibold text-foreground">
                                        {shipping.order?.invoice_number || 'N/A'}
                                    </span>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-xs text-muted-foreground block">Customer Name</span>
                                    <span className="text-sm font-semibold text-foreground">
                                        {shipping.order?.customer_name || 'Walk-in Customer'}
                                    </span>
                                </div>
                                
                                <div className="pt-2">
                                    <Link href={`/dashboard/orders/${shipping.order_id}`}>
                                        <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                                            View Full Order Details
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* TIMESTAMPS CARD */}
                        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                Logistics Timeline
                            </h3>
                            <hr className="border-border" />

                            <div className="space-y-3 text-xs text-muted-foreground">
                                <div className="flex justify-between">
                                    <span>Created</span>
                                    <span className="font-medium text-foreground">
                                        {new Date(shipping.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipped</span>
                                    <span className="font-medium text-foreground">
                                        {shipping.shipped_at 
                                            ? new Date(shipping.shipped_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                            : 'Not shipped yet'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Delivered</span>
                                    <span className="font-medium text-foreground">
                                        {shipping.delivered_at 
                                            ? new Date(shipping.delivered_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                            : 'Not delivered yet'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
