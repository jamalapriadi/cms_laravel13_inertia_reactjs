interface TableData {
    rows: number;
    columns: number;
    headers: string[];
    cells: string[][];
    headerBackground: string;
    headerColor: string;
    bodyBackground: string;
    bodyColor: string;
    borderColor: string;
    borderWidth: number;
    cellPadding: number;
    striped: boolean;
}

const defaultHeader = (index: number) => `Column ${index + 1}`;

const normalizeHeaders = (headers: string[] = [], columns: number) =>
    Array.from(
        { length: columns },
        (_, index) => headers[index] ?? defaultHeader(index),
    );

const normalizeCells = (
    cells: string[][] = [],
    rows: number,
    columns: number,
) =>
    Array.from({ length: rows }, (_, rowIndex) =>
        Array.from(
            { length: columns },
            (_, columnIndex) => cells[rowIndex]?.[columnIndex] ?? '',
        ),
    );

const normalizeTable = (data: Partial<TableData> = {}): TableData => {
    const rows = Math.min(Math.max(Number(data.rows) || 3, 1), 20);
    const columns = Math.min(Math.max(Number(data.columns) || 3, 1), 12);

    return {
        rows,
        columns,
        headers: normalizeHeaders(data.headers, columns),
        cells: normalizeCells(data.cells, rows, columns),
        headerBackground: data.headerBackground || '#f3f4f6',
        headerColor: data.headerColor || '#111827',
        bodyBackground: data.bodyBackground || '#ffffff',
        bodyColor: data.bodyColor || '#374151',
        borderColor: data.borderColor || '#d1d5db',
        borderWidth: Number(data.borderWidth) || 1,
        cellPadding: Number(data.cellPadding) || 12,
        striped: data.striped ?? true,
    };
};

export default {
    type: 'table',

    create(): TableData {
        return normalizeTable();
    },

    render({ data }: any) {
        const table = normalizeTable(data);

        return (
            <div className="w-full overflow-x-auto">
                <table
                    className="w-full border-collapse text-left text-sm"
                    style={{
                        borderColor: table.borderColor,
                        borderWidth: table.borderWidth,
                    }}
                >
                    <thead>
                        <tr>
                            {table.headers.map((header, index) => (
                                <th
                                    key={index}
                                    style={{
                                        background: table.headerBackground,
                                        color: table.headerColor,
                                        borderColor: table.borderColor,
                                        borderWidth: table.borderWidth,
                                        padding: table.cellPadding,
                                    }}
                                    className="border font-semibold"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {table.cells.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.map((cell, columnIndex) => (
                                    <td
                                        key={`${rowIndex}-${columnIndex}`}
                                        style={{
                                            background:
                                                table.striped &&
                                                rowIndex % 2 === 1
                                                    ? '#f9fafb'
                                                    : table.bodyBackground,
                                            color: table.bodyColor,
                                            borderColor: table.borderColor,
                                            borderWidth: table.borderWidth,
                                            padding: table.cellPadding,
                                        }}
                                        className="border align-top"
                                    >
                                        {cell || (
                                            <span className="text-muted-foreground">
                                                Empty
                                            </span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    },

    editor({ data, onChange }: any) {
        const table = normalizeTable(data);

        const resizeTable = (rows: number, columns: number) => {
            const nextRows = Math.min(Math.max(rows, 1), 20);
            const nextColumns = Math.min(Math.max(columns, 1), 12);

            onChange({
                rows: nextRows,
                columns: nextColumns,
                headers: normalizeHeaders(table.headers, nextColumns),
                cells: normalizeCells(table.cells, nextRows, nextColumns),
            });
        };

        const updateHeader = (index: number, value: string) => {
            const headers = [...table.headers];
            headers[index] = value;
            onChange({ headers });
        };

        const updateCell = (
            rowIndex: number,
            columnIndex: number,
            value: string,
        ) => {
            const cells = table.cells.map((row) => [...row]);
            cells[rowIndex][columnIndex] = value;
            onChange({ cells });
        };

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <label className="grid gap-1 text-xs text-muted-foreground">
                        Rows
                        <input
                            type="number"
                            min={1}
                            max={20}
                            className="rounded border p-2"
                            value={table.rows}
                            onChange={(e) =>
                                resizeTable(
                                    Number(e.target.value),
                                    table.columns,
                                )
                            }
                        />
                    </label>
                    <label className="grid gap-1 text-xs text-muted-foreground">
                        Columns
                        <input
                            type="number"
                            min={1}
                            max={12}
                            className="rounded border p-2"
                            value={table.columns}
                            onChange={(e) =>
                                resizeTable(table.rows, Number(e.target.value))
                            }
                        />
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <label className="grid gap-1 text-xs text-muted-foreground">
                        Header bg
                        <input
                            type="color"
                            className="h-10 w-full rounded border p-1"
                            value={table.headerBackground}
                            onChange={(e) =>
                                onChange({
                                    headerBackground: e.target.value,
                                })
                            }
                        />
                    </label>
                    <label className="grid gap-1 text-xs text-muted-foreground">
                        Header text
                        <input
                            type="color"
                            className="h-10 w-full rounded border p-1"
                            value={table.headerColor}
                            onChange={(e) =>
                                onChange({ headerColor: e.target.value })
                            }
                        />
                    </label>
                    <label className="grid gap-1 text-xs text-muted-foreground">
                        Body bg
                        <input
                            type="color"
                            className="h-10 w-full rounded border p-1"
                            value={table.bodyBackground}
                            onChange={(e) =>
                                onChange({ bodyBackground: e.target.value })
                            }
                        />
                    </label>
                    <label className="grid gap-1 text-xs text-muted-foreground">
                        Body text
                        <input
                            type="color"
                            className="h-10 w-full rounded border p-1"
                            value={table.bodyColor}
                            onChange={(e) =>
                                onChange({ bodyColor: e.target.value })
                            }
                        />
                    </label>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <label className="grid gap-1 text-xs text-muted-foreground">
                        Border
                        <input
                            type="color"
                            className="h-10 w-full rounded border p-1"
                            value={table.borderColor}
                            onChange={(e) =>
                                onChange({ borderColor: e.target.value })
                            }
                        />
                    </label>
                    <label className="grid gap-1 text-xs text-muted-foreground">
                        Width
                        <input
                            type="number"
                            min={0}
                            max={8}
                            className="rounded border p-2"
                            value={table.borderWidth}
                            onChange={(e) =>
                                onChange({
                                    borderWidth: Number(e.target.value),
                                })
                            }
                        />
                    </label>
                    <label className="grid gap-1 text-xs text-muted-foreground">
                        Padding
                        <input
                            type="number"
                            min={0}
                            max={48}
                            className="rounded border p-2"
                            value={table.cellPadding}
                            onChange={(e) =>
                                onChange({
                                    cellPadding: Number(e.target.value),
                                })
                            }
                        />
                    </label>
                </div>

                <label className="flex items-center gap-2 rounded border bg-background p-2 text-xs text-muted-foreground">
                    <input
                        type="checkbox"
                        checked={table.striped}
                        onChange={(e) =>
                            onChange({ striped: e.target.checked })
                        }
                    />
                    Striped rows
                </label>

                <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">
                        Header
                    </p>
                    <div className="grid gap-2">
                        {table.headers.map((header, index) => (
                            <input
                                key={index}
                                className="rounded border p-2 text-sm"
                                value={header}
                                onChange={(e) =>
                                    updateHeader(index, e.target.value)
                                }
                                placeholder={defaultHeader(index)}
                            />
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">
                        Body cells
                    </p>
                    <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                        {table.cells.map((row, rowIndex) => (
                            <div
                                key={rowIndex}
                                className="grid gap-2"
                                style={{
                                    gridTemplateColumns: `repeat(${table.columns}, minmax(120px, 1fr))`,
                                }}
                            >
                                {row.map((cell, columnIndex) => (
                                    <input
                                        key={`${rowIndex}-${columnIndex}`}
                                        className="min-w-0 rounded border p-2 text-sm"
                                        value={cell}
                                        onChange={(e) =>
                                            updateCell(
                                                rowIndex,
                                                columnIndex,
                                                e.target.value,
                                            )
                                        }
                                        placeholder={`R${rowIndex + 1} C${columnIndex + 1}`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    },
};
