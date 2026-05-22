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
    PackageOpen,
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
    status:
        | 'pending'
        | 'processing'
        | 'shipped'
        | 'delivered'
        | 'failed'
        | 'returned';
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
        {
            label: 'Processing',
            desc: 'Packing & sorting',
            step: 2,
            icon: PackageOpen,
        },
        {
            label: 'Shipped',
            desc: 'Dispatched in transit',
            step: 3,
            icon: Compass,
        },
        {
            label: 'Delivered',
            desc: 'Received at destination',
            step: 4,
            icon: CheckCircle2,
        },
    ];

    const currentStep = getStatusStep();

    return (
        <>
            <Head title={`Shipment Details - ${shipping.courier}`} />

            <div className="container mx-auto max-w-5xl space-y-8 px-6 py-8">
                {/* HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/ecommerce/shipping">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 w-9 p-0"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">
                                {shipping.courier} Shipment
                            </h1>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Resi / Airway Bill:{' '}
                                <span className="font-mono font-semibold">
                                    {shipping.tracking_number || 'N/A'}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/dashboard/ecommerce/shipping/${shipping.id}/edit`}
                        >
                            <Button variant="outline">Edit Details</Button>
                        </Link>
                        <Button
                            onClick={handlePrintReceipt}
                            className="flex items-center gap-2"
                        >
                            <Printer className="h-4 w-4" />
                            Print Receipt / Resi
                        </Button>
                    </div>
                </div>

                <hr className="border-border" />

                {/* DANGER BANNERS FOR ERROR STATES */}
                {shipping.status === 'failed' && (
                    <div className="flex items-start gap-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-100 dark:bg-rose-950/40 p-4 text-rose-800 dark:text-rose-300">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700 dark:text-rose-300" />
                        <div>
                            <h4 className="font-bold">
                                Shipment Delivery Failed
                            </h4>
                            <p className="mt-0.5 text-sm text-rose-800 dark:text-rose-300">
                                This shipment could not be successfully
                                delivered. Please check the destination address
                                or contact the carrier.
                            </p>
                        </div>
                    </div>
                )}

                {shipping.status === 'returned' && (
                    <div className="flex items-start gap-3 rounded-xl border border-orange-200 dark:border-orange-900/60 bg-orange-100 dark:bg-orange-950/40 p-4 text-orange-800">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                        <div>
                            <h4 className="font-bold">
                                Shipment Returned to Sender
                            </h4>
                            <p className="mt-0.5 text-sm text-orange-800 dark:text-orange-300">
                                This shipment has been returned back to the
                                warehouse by the courier.
                            </p>
                        </div>
                    </div>
                )}

                {/* DELIVERY TIMELINE */}
                {currentStep > 0 && (
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h3 className="mb-6 font-bold text-foreground">
                            Delivery Progress
                        </h3>
                        <div className="relative flex flex-col items-center justify-between gap-6 md:flex-row md:gap-4">
                            {/* Connector Line */}
                            <div className="absolute top-1/2 right-0 left-0 z-0 hidden h-0.5 -translate-y-1/2 bg-muted md:block dark:bg-muted" />

                            {timelineSteps.map((step) => {
                                const StepIcon = step.icon;
                                const isCompleted = currentStep >= step.step;
                                const isCurrent = currentStep === step.step;

                                return (
                                    <div
                                        key={step.step}
                                        className="z-10 flex w-full flex-row items-center gap-4 md:w-auto md:flex-col md:gap-2.5"
                                    >
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                                isCompleted
                                                    ? 'border-primary bg-primary font-bold text-primary-foreground'
                                                    : 'border-border bg-background text-muted-foreground'
                                            } ${isCurrent ? 'scale-110 ring-4 ring-primary/20' : ''}`}
                                        >
                                            <StepIcon className="h-5 w-5" />
                                        </div>
                                        <div className="text-left md:text-center">
                                            <h4
                                                className={`text-sm font-bold ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}
                                            >
                                                {step.label}
                                            </h4>
                                            <p className="text-xs text-muted-foreground">
                                                {step.desc}
                                            </p>
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
                    <div className="space-y-6 md:col-span-2">
                        {/* SHIPMENT INFO CARD */}
                        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
                            <h3 className="flex items-center gap-2 font-bold text-foreground">
                                <Truck className="h-4 w-4 text-primary" />
                                Shipment Specifications
                            </h3>
                            <hr className="border-border" />

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1">
                                    <span className="block text-xs text-muted-foreground">
                                        Courier Service
                                    </span>
                                    <span className="text-sm font-semibold text-foreground uppercase">
                                        {shipping.courier}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-xs text-muted-foreground">
                                        Tracking Resi Number
                                    </span>
                                    <span className="font-mono text-sm font-semibold text-foreground">
                                        {shipping.tracking_number || '-'}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-xs text-muted-foreground">
                                        Logistic Shipping Cost
                                    </span>
                                    <span className="text-sm font-semibold text-foreground">
                                        Rp{' '}
                                        {Number(
                                            shipping.shipping_cost,
                                        ).toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-xs text-muted-foreground">
                                        Current Status
                                    </span>
                                    <span className="inline-flex items-center rounded-md border border-indigo-200 dark:border-indigo-900/60 bg-indigo-100 dark:bg-indigo-950/40 px-2 py-0.5 text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase">
                                        {shipping.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* DESTINATION ADDRESS CARD */}
                        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
                            <h3 className="flex items-center gap-2 font-bold text-foreground">
                                <MapPin className="h-4 w-4 text-primary" />
                                Delivery Destination
                            </h3>
                            <hr className="border-border" />
                            <div className="space-y-1">
                                <span className="block text-xs text-muted-foreground">
                                    Recipient Address
                                </span>
                                <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">
                                    {shipping.shipping_address ||
                                        'No shipping address provided.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: ASSOCIATED ORDER */}
                    <div className="space-y-6">
                        {/* ORDER METADATA */}
                        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
                            <h3 className="flex items-center gap-2 font-bold text-foreground">
                                <FileText className="h-4 w-4 text-primary" />
                                Associated Order
                            </h3>
                            <hr className="border-border" />

                            <div className="space-y-3">
                                <div className="space-y-0.5">
                                    <span className="block text-xs text-muted-foreground">
                                        Invoice Number
                                    </span>
                                    <span className="text-sm font-semibold text-foreground">
                                        {shipping.order?.invoice_number ||
                                            'N/A'}
                                    </span>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="block text-xs text-muted-foreground">
                                        Customer Name
                                    </span>
                                    <span className="text-sm font-semibold text-foreground">
                                        {shipping.order?.customer_name ||
                                            'Walk-in Customer'}
                                    </span>
                                </div>

                                <div className="pt-2">
                                    <Link
                                        href={`/dashboard/orders/${shipping.order_id}`}
                                    >
                                        <Button
                                            variant="outline"
                                            className="flex w-full items-center justify-center gap-2"
                                        >
                                            View Full Order Details
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* TIMESTAMPS CARD */}
                        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
                            <h3 className="flex items-center gap-2 font-bold text-foreground">
                                <Calendar className="h-4 w-4 text-primary" />
                                Logistics Timeline
                            </h3>
                            <hr className="border-border" />

                            <div className="space-y-3 text-xs text-muted-foreground">
                                <div className="flex justify-between">
                                    <span>Created</span>
                                    <span className="font-medium text-foreground">
                                        {new Date(
                                            shipping.created_at,
                                        ).toLocaleString('id-ID', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipped</span>
                                    <span className="font-medium text-foreground">
                                        {shipping.shipped_at
                                            ? new Date(
                                                  shipping.shipped_at,
                                              ).toLocaleString('id-ID', {
                                                  day: '2-digit',
                                                  month: 'short',
                                                  year: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                              })
                                            : 'Not shipped yet'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Delivered</span>
                                    <span className="font-medium text-foreground">
                                        {shipping.delivered_at
                                            ? new Date(
                                                  shipping.delivered_at,
                                              ).toLocaleString('id-ID', {
                                                  day: '2-digit',
                                                  month: 'short',
                                                  year: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                              })
                                            : 'Not delivered yet'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
