// resources/js/Components/DataTable.tsx

import { Link } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Column<T> {
    label: string;
    render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
}

export function DataTable<T>({ data, columns }: DataTableProps<T>) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {columns.map((col, i) => (
                        <TableHead key={i}>{col.label}</TableHead>
                    ))}
                </TableRow>
            </TableHeader>

            <TableBody>
                {data.map((row: any, i) => (
                    <TableRow key={i}>
                        {columns.map((col, j) => (
                            <TableCell key={j}>{col.render(row)}</TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
