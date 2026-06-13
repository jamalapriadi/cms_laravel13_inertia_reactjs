import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface StockUnitPrintItem {
    id: string;
    product_name: string;
    sku: string;
    barcode: string;
    barcode_svg: string;
    imei_serial_number: string;
    grade?: string | null;
    battery_health?: number | null;
    status: string;
}

interface Props {
    stockUnits: StockUnitPrintItem[];
    context: {
        title: string;
        subtitle: string;
        total: number;
    };
}

export default function BarcodePrint({ stockUnits, context }: Props) {
    return (
        <>
            <Head title="Print Barcode Stock Unit" />

            <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 md:p-6">
                <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm">
                    <div>
                        <h1 className="text-lg font-semibold">{context.title}</h1>
                        <p className="text-sm text-muted-foreground">{context.subtitle}</p>
                        <p className="text-xs text-muted-foreground">Total label: {context.total}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/my-admin/dashboard/ecommerce/product-stock-units">
                            <Button variant="outline" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <Button className="gap-2" onClick={() => window.print()}>
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5 print:grid-cols-4 print:gap-2">
                    {stockUnits.map((item) => (
                        <div key={item.id} className="barcode-label rounded-lg border bg-white p-2 text-black shadow-sm">
                            <p className="line-clamp-1 text-[10px] leading-tight font-semibold">{item.product_name}</p>
                            <p className="text-[9px] leading-tight">SKU: {item.sku}</p>

                            <div
                                className="mt-1 flex justify-center"
                                dangerouslySetInnerHTML={{ __html: item.barcode_svg }}
                            />

                            <p className="mt-0.5 text-center font-mono text-[10px] tracking-wide">{item.barcode}</p>
                            <p className="line-clamp-1 text-[9px] leading-tight">IMEI: {item.imei_serial_number}</p>

                            <div className="mt-0.5 flex items-center justify-between text-[9px] leading-tight">
                                <span>Grade: {item.grade || '-'}</span>
                                <span>Battery: {item.battery_health !== null && item.battery_health !== undefined ? `${item.battery_health}%` : '-'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .barcode-label {
                    width: 50mm;
                    min-height: 30mm;
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                .no-print {
                    display: flex;
                }

                @media print {
                    @page {
                        margin: 4mm;
                    }

                    .no-print {
                        display: none !important;
                    }

                    body {
                        background: #fff;
                    }

                    .barcode-label {
                        box-shadow: none !important;
                        border: 1px solid #d1d5db;
                    }
                }
            `}</style>
        </>
    );
}
