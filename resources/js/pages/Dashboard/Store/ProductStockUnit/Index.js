"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Index;
var react_1 = require("@inertiajs/react");
var lucide_react_1 = require("lucide-react");
var react_2 = require("react");
var DataTable_1 = require("@/components/DataTable");
var SearchableSelect_1 = require("@/components/SearchableSelect");
var alert_dialog_1 = require("@/components/ui/alert-dialog");
var button_1 = require("@/components/ui/button");
var input_1 = require("@/components/ui/input");
var networkLabel = function (network) {
    var _a;
    return network
        ? ((_a = {
            sim_free: 'All Operator',
            docomo: 'Docomo',
            au: 'AU',
            softbank: 'SoftBank',
            rakuten: 'Rakuten',
            mineo: 'Mineo',
        }[network]) !== null && _a !== void 0 ? _a : network)
        : '-';
};
var statusClass = function (status) {
    return ({
        available: 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
        reserved: 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
        sold: 'border-border bg-muted/50 text-foreground',
        damaged: 'border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300',
    })[status];
};
function SummaryCard(_a) {
    var title = _a.title, value = _a.value, Icon = _a.icon;
    return (<div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    {title}
                </span>
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="h-4 w-4"/>
                </div>
            </div>
            <p className="mt-4 text-3xl font-extrabold tracking-tight text-foreground">
                {value.toLocaleString('id-ID')}
            </p>
        </div>);
}
function Index(_a) {
    var stockUnits = _a.stockUnits, variants = _a.variants, summary = _a.summary, filters = _a.filters;
    var _b = (0, react_2.useState)(filters.search || ''), search = _b[0], setSearch = _b[1];
    var _c = (0, react_2.useState)(filters.status || ''), status = _c[0], setStatus = _c[1];
    var _d = (0, react_2.useState)(filters.product_variant_id || ''), variantId = _d[0], setVariantId = _d[1];
    var _e = (0, react_2.useState)(null), deletingId = _e[0], setDeletingId = _e[1];
    var applyFilter = function () {
        react_1.router.get('/my-admin/dashboard/ecommerce/product-stock-units', {
            search: search,
            status: status,
            product_variant_id: variantId,
        }, {
            preserveState: true,
            replace: true,
        });
    };
    var clearFilter = function () {
        setSearch('');
        setStatus('');
        setVariantId('');
        react_1.router.get('/my-admin/dashboard/ecommerce/product-stock-units', {}, { replace: true });
    };
    var columns = [
        {
            label: 'IMEI / Serial',
            render: function (row) { return (<div className="flex flex-col">
                    <span className="font-mono text-sm font-semibold">
                        {row.imei_serial_number}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        Network: {networkLabel(row.network_compatibility)}
                    </span>
                </div>); },
        },
        {
            label: 'Product',
            render: function (row) {
                var _a, _b, _c;
                return (<span className="text-sm font-medium">
                    {((_a = row.product) === null || _a === void 0 ? void 0 : _a.name) || ((_c = (_b = row.variant) === null || _b === void 0 ? void 0 : _b.product) === null || _c === void 0 ? void 0 : _c.name) || '-'}
                </span>);
            },
        },
        {
            label: 'Product Variant',
            render: function (row) {
                var _a, _b, _c, _d;
                return (<div className="flex flex-col">
                    <span className="text-sm font-medium">
                        {((_a = row.variant) === null || _a === void 0 ? void 0 : _a.name) || ((_b = row.product) === null || _b === void 0 ? void 0 : _b.name) || '-'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        SKU: {((_c = row.variant) === null || _c === void 0 ? void 0 : _c.sku) || ((_d = row.product) === null || _d === void 0 ? void 0 : _d.sku) || '-'}
                    </span>
                </div>);
            },
        },
        {
            label: 'Status',
            render: function (row) { return (<span className={"inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold uppercase ".concat(statusClass(row.status))}>
                    {row.status}
                </span>); },
        },
        {
            label: 'Note',
            render: function (row) { return (<span title={row.note || ''} className="block max-w-55 truncate text-xs text-muted-foreground">
                    {row.note || '-'}
                </span>); },
        },
        {
            label: 'Actions',
            render: function (row) { return (<div className="flex items-center gap-2">
                    <react_1.Link href={"/my-admin/dashboard/ecommerce/product-stock-units/".concat(row.id)}>
                        <button_1.Button size="sm" variant="secondary" title="Detail">
                            <lucide_react_1.Eye className="h-3.5 w-3.5"/>
                        </button_1.Button>
                    </react_1.Link>
                    <react_1.Link href={"/my-admin/dashboard/ecommerce/product-stock-units/".concat(row.id, "/edit")}>
                        <button_1.Button size="sm" variant="secondary" title="Edit">
                            <lucide_react_1.Edit className="h-3.5 w-3.5"/>
                        </button_1.Button>
                    </react_1.Link>
                    <button_1.Button size="sm" variant="destructive" title="Delete" onClick={function () { return setDeletingId(row.id); }}>
                        <lucide_react_1.Trash className="h-3.5 w-3.5"/>
                    </button_1.Button>
                </div>); },
        },
    ];
    var handleDelete = function () {
        if (!deletingId) {
            return;
        }
        react_1.router.delete("/my-admin/dashboard/ecommerce/product-stock-units/".concat(deletingId), {
            preserveScroll: true,
            onFinish: function () { return setDeletingId(null); },
        });
    };
    return (<>
            <react_1.Head title="Stok Unit"/>

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Stok Unit
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Daftar IMEI/serial unit beserta product dan product
                            variant yang terhubung.
                        </p>
                    </div>

                    <react_1.Link href="/my-admin/dashboard/ecommerce/product-stock-units/create">
                        <button_1.Button className="gap-2">
                            <lucide_react_1.Plus className="h-4 w-4"/>
                            Add Stok Unit
                        </button_1.Button>
                    </react_1.Link>
                </div>

                <div className="grid gap-5 md:grid-cols-5">
                    <SummaryCard title="Product" value={summary.products} icon={lucide_react_1.Package}/>
                    <SummaryCard title="Product Variant" value={summary.product_variants} icon={lucide_react_1.Boxes}/>
                    <SummaryCard title="Stok Unit" value={summary.stock_units} icon={lucide_react_1.ScanBarcode}/>
                    <SummaryCard title="Available" value={summary.available_stock_units} icon={lucide_react_1.CheckCircle2}/>
                    <SummaryCard title="Non Available" value={summary.non_available_stock_units} icon={lucide_react_1.XCircle}/>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div>
                        <input_1.Input className="max-w-xs" placeholder="Search IMEI, product, variant..." value={search} onChange={function (e) { return setSearch(e.target.value); }} onKeyDown={function (e) {
            return e.key === 'Enter' && applyFilter();
        }}/>
                    </div>

                    <div>
                        <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none" value={status} onChange={function (e) { return setStatus(e.target.value); }}>
                            <option value="">All Status</option>
                            <option value="available">Available</option>
                            <option value="reserved">Reserved</option>
                            <option value="sold">Sold</option>
                            <option value="damaged">Damaged</option>
                        </select>
                    </div>

                    <div>
                        <SearchableSelect_1.default className="min-w-72" options={variants.map(function (variant) { return ({
            value: variant.id,
            label: variant.name,
            description: variant.sku,
        }); })} value={variantId} onChange={function (value) { return setVariantId(value !== null && value !== void 0 ? value : ''); }} placeholder="All Product Variants" clearable/>
                    </div>

                    <button_1.Button onClick={applyFilter}>Apply Filter</button_1.Button>
                    <button_1.Button variant="outline" onClick={clearFilter}>
                        Clear
                    </button_1.Button>
                </div>

                <DataTable_1.DataTable data={stockUnits.data} columns={columns}/>

                <div className="flex flex-wrap gap-2">
                    {stockUnits.links.map(function (link, i) { return (<button key={i} dangerouslySetInnerHTML={{
                __html: link.label,
            }} disabled={!link.url} onClick={function () { return link.url && react_1.router.visit(link.url); }} className={"rounded px-3 py-1 text-sm ".concat(link.active
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted', " ").concat(!link.url && 'opacity-50')}/>); })}
                </div>
            </div>

            <alert_dialog_1.AlertDialog open={!!deletingId} onOpenChange={function () { return setDeletingId(null); }}>
                <alert_dialog_1.AlertDialogContent>
                    <alert_dialog_1.AlertDialogHeader>
                        <alert_dialog_1.AlertDialogTitle>Delete stok unit?</alert_dialog_1.AlertDialogTitle>
                        <alert_dialog_1.AlertDialogDescription>
                            This action will delete the selected IMEI/serial
                            stock unit and resync its variant stock.
                        </alert_dialog_1.AlertDialogDescription>
                    </alert_dialog_1.AlertDialogHeader>
                    <alert_dialog_1.AlertDialogFooter>
                        <alert_dialog_1.AlertDialogCancel>Cancel</alert_dialog_1.AlertDialogCancel>
                        <alert_dialog_1.AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
                            Delete
                        </alert_dialog_1.AlertDialogAction>
                    </alert_dialog_1.AlertDialogFooter>
                </alert_dialog_1.AlertDialogContent>
            </alert_dialog_1.AlertDialog>
        </>);
}
