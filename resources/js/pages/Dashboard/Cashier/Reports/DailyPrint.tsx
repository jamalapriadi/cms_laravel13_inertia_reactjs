import { Head } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Props {
    filters: any;
    summary: any;
    paymentBreakdown: any[];
    cashierBreakdown: any[];
    sessionBreakdown: any[];
    cashMovementBreakdown: any;
    refundBreakdown: any;
    discountBreakdown: any;
    priceOverrideBreakdown: any;
}

export default function DailyClosingReportPrint({
    filters,
    summary,
    paymentBreakdown,
    cashierBreakdown,
    sessionBreakdown,
    cashMovementBreakdown,
    refundBreakdown,
    discountBreakdown,
    priceOverrideBreakdown
}: Props) {
    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount));
    };

    const dateDisplay = filters.date 
        ? filters.date 
        : (filters.start_date && filters.end_date ? `${filters.start_date} s/d ${filters.end_date}` : new Date().toISOString().split('T')[0]);

    return (
        <>
            <Head title={`Print Daily Closing Report - ${dateDisplay}`} />
            <div className="bg-white text-black p-8 max-w-4xl mx-auto font-sans" style={{ '@media print': { margin: 0, padding: '20px' } } as any}>
                <div className="text-center border-b-2 border-black pb-4 mb-6">
                    <h1 className="text-2xl font-bold uppercase tracking-wider">Daily Closing Report</h1>
                    <p className="text-sm mt-1">Periode: {dateDisplay}</p>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h2 className="font-bold border-b border-gray-300 mb-2">Sales Summary</h2>
                        <div className="flex justify-between py-1"><span className="text-gray-600">Total Orders</span><span className="font-medium">{summary.total_orders}</span></div>
                        <div className="flex justify-between py-1"><span className="text-gray-600">Gross Sales</span><span className="font-medium">{formatCurrency(summary.gross_sales)}</span></div>
                        <div className="flex justify-between py-1"><span className="text-gray-600">Total Refund</span><span className="font-medium text-red-600">{formatCurrency(summary.total_refund)}</span></div>
                        <div className="flex justify-between py-1"><span className="text-gray-600">Total Diskon</span><span className="font-medium">{formatCurrency(summary.total_discount)}</span></div>
                        <div className="flex justify-between py-1 font-bold border-t border-gray-300 mt-1 pt-1"><span>Net Sales</span><span>{formatCurrency(summary.net_sales)}</span></div>
                    </div>
                    
                    <div>
                        <h2 className="font-bold border-b border-gray-300 mb-2">Cash Summary</h2>
                        <div className="flex justify-between py-1"><span className="text-gray-600">Expected Cash</span><span className="font-medium">{formatCurrency(summary.total_expected_cash)}</span></div>
                        <div className="flex justify-between py-1"><span className="text-gray-600">Closing Cash</span><span className="font-medium">{formatCurrency(summary.total_closing_cash)}</span></div>
                        <div className="flex justify-between py-1 font-bold border-t border-gray-300 mt-1 pt-1"><span>Selisih Kas</span><span className={summary.total_cash_difference < 0 ? 'text-red-600' : ''}>{formatCurrency(summary.total_cash_difference)}</span></div>
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="font-bold mb-2">Payment Breakdown</h2>
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-y border-black">
                                <th className="py-1 text-left font-semibold">Metode</th>
                                <th className="py-1 text-center font-semibold">Orders</th>
                                <th className="py-1 text-right font-semibold">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentBreakdown.map((row, idx) => (
                                <tr key={idx} className="border-b border-gray-200">
                                    <td className="py-1 capitalize">{row.method}</td>
                                    <td className="py-1 text-center">{row.total_orders}</td>
                                    <td className="py-1 text-right">{formatCurrency(row.total_amount)} ({row.percentage}%)</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mb-8">
                    <h2 className="font-bold mb-2">Cashier Breakdown</h2>
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-y border-black">
                                <th className="py-1 text-left font-semibold">Kasir</th>
                                <th className="py-1 text-center font-semibold">Orders</th>
                                <th className="py-1 text-right font-semibold">Gross</th>
                                <th className="py-1 text-right font-semibold">Refund</th>
                                <th className="py-1 text-right font-semibold">Net</th>
                                <th className="py-1 text-right font-semibold">Selisih</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cashierBreakdown.map((row, idx) => (
                                <tr key={idx} className="border-b border-gray-200">
                                    <td className="py-1">{row.cashier_name}</td>
                                    <td className="py-1 text-center">{row.total_orders}</td>
                                    <td className="py-1 text-right">{formatCurrency(row.gross_sales)}</td>
                                    <td className="py-1 text-right">{formatCurrency(row.total_refund)}</td>
                                    <td className="py-1 text-right">{formatCurrency(row.net_sales)}</td>
                                    <td className="py-1 text-right text-red-600">{formatCurrency(row.total_cash_difference)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-16 pt-8 flex justify-between">
                    <div className="text-center w-48">
                        <p className="mb-16">Prepared By</p>
                        <p className="border-t border-black pt-1">(________________)</p>
                    </div>
                    <div className="text-center w-48">
                        <p className="mb-16">Checked By</p>
                        <p className="border-t border-black pt-1">(________________)</p>
                    </div>
                    <div className="text-center w-48">
                        <p className="mb-16">Approved By</p>
                        <p className="border-t border-black pt-1">(________________)</p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
                }
            `}} />
            <script dangerouslySetInnerHTML={{__html: `
                window.onload = function() { window.print(); }
            `}} />
        </>
    );
}

DailyClosingReportPrint.layout = (page: any) => page;
