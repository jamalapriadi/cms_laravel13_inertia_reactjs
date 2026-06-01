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
var master_data_layout_1 = require("@/layouts/master-data-layout");
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
    var products = _a.products, categories = _a.categories, brands = _a.brands, summary = _a.summary, filters = _a.filters;
    var _b = (0, react_2.useState)(filters.search || ''), search = _b[0], setSearch = _b[1];
    var _c = (0, react_2.useState)(filters.category_id || ''), categoryId = _c[0], setCategoryId = _c[1];
    var _d = (0, react_2.useState)(filters.brand_id || ''), brandId = _d[0], setBrandId = _d[1];
    var _e = (0, react_2.useState)(null), deletingId = _e[0], setDeletingId = _e[1];
    var _f = (0, react_2.useState)(false), isImportDialogOpen = _f[0], setIsImportDialogOpen = _f[1];
    var fileInputRef = (0, react_2.useRef)(null);
    var openImportDialog = function () {
        setIsImportDialogOpen(true);
    };
    var closeImportDialog = function () {
        setIsImportDialogOpen(false);
    };
    var downloadImportTemplate = function () {
        window.location.href = '/dashboard/ecommerce/products/template';
    };
    var triggerImport = function () {
        var _a;
        (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
    };
    var handleImportFile = function (event) {
        var _a;
        var file = (_a = event.currentTarget.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file) {
            return;
        }
        react_1.router.post('/dashboard/ecommerce/products/import', { file: file }, {
            forceFormData: true,
            preserveState: true,
            onFinish: function () {
                event.currentTarget.value = '';
                setIsImportDialogOpen(false);
            },
        });
    };
    var exportProducts = function () {
        var params = new URLSearchParams();
        if (search)
            params.append('search', search);
        if (categoryId)
            params.append('category_id', categoryId);
        if (brandId)
            params.append('brand_id', brandId);
        window.location.href = "/dashboard/ecommerce/products/export".concat(params.toString() ? "?".concat(params.toString()) : '');
    };
    /**
     * FILTER
     */
    var applyFilter = function () {
        react_1.router.get('/dashboard/ecommerce/products', {
            search: search,
            category_id: categoryId,
            brand_id: brandId,
        }, {
            preserveState: true,
            replace: true,
        });
    };
    /**
     * DELETE
     */
    var handleDelete = function () {
        if (!deletingId) {
            return;
        }
        react_1.router.delete("/dashboard/ecommerce/products/".concat(deletingId), {
            onFinish: function () { return setDeletingId(null); },
        });
    };
    /**
     * TABLE COLUMNS
     */
    var columns = [
        {
            label: 'Name',
            render: function (row) { return (<div className="flex flex-col">
                    <span className="font-medium">{row.name}</span>
                    <span className="text-xs text-muted-foreground">
                        {row.slug}
                    </span>
                </div>); },
        },
        {
            label: 'Category',
            render: function (row) {
                var _a;
                return (<span className="text-sm">{((_a = row.category) === null || _a === void 0 ? void 0 : _a.name) || '-'}</span>);
            },
        },
        {
            label: 'Brand',
            render: function (row) {
                var _a;
                return (<span className="text-sm">{((_a = row.brand) === null || _a === void 0 ? void 0 : _a.name) || '-'}</span>);
            },
        },
        {
            label: 'Base Price',
            render: function (row) { return (<span className="text-sm font-medium">
                    ¥{Number(row.base_price).toLocaleString('ja-JP')}
                </span>); },
        },
        {
            label: 'Condition',
            render: function (row) { return (<span className="text-sm capitalize">
                    {row.condition.replace('_', ' ')}
                </span>); },
        },
        {
            label: 'Status',
            render: function (row) { return (<span className={"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ".concat(row.is_publish
                    ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300')}>
                    {row.is_publish ? 'Published' : 'Draft'}
                </span>); },
        },
        {
            label: 'Action',
            render: function (row) { return (<div className="flex flex-wrap gap-2">
                    <react_1.Link href={"/dashboard/ecommerce/products/".concat(row.id)}>
                        <button_1.Button size="sm" variant="outline" className="border-primary/50 text-primary hover:bg-primary/5">
                            Detail
                        </button_1.Button>
                    </react_1.Link>

                    <react_1.Link href={"/dashboard/ecommerce/products/".concat(row.id, "/edit")}>
                        <button_1.Button size="sm" variant="secondary">
                            Edit
                        </button_1.Button>
                    </react_1.Link>

                    <button_1.Button size="sm" variant="destructive" onClick={function () { return setDeletingId(row.id); }}>
                        Delete
                    </button_1.Button>
                </div>); },
        },
    ];
    return (<master_data_layout_1.default>
            <react_1.Head title="Products"/>

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Products</h1>

                        <p className="text-muted-foreground">
                            List of registered products
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button_1.Button variant="outline" onClick={exportProducts}>
                            Export Excel
                        </button_1.Button>

                        <button_1.Button variant="secondary" onClick={openImportDialog}>
                            Import Excel
                        </button_1.Button>

                        <react_1.Link href="/dashboard/ecommerce/products/create">
                            <button_1.Button>Add Product</button_1.Button>
                        </react_1.Link>
                    </div>

                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile}/>

                    <alert_dialog_1.AlertDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                        <alert_dialog_1.AlertDialogContent>
                            <alert_dialog_1.AlertDialogHeader>
                                <alert_dialog_1.AlertDialogTitle>
                                    Import Produk dari Excel
                                </alert_dialog_1.AlertDialogTitle>
                            </alert_dialog_1.AlertDialogHeader>
                            <alert_dialog_1.AlertDialogDescription>
                                Unggah file Excel (.xlsx, .xls, .csv) berisi
                                daftar produk dengan kolom yang sesuai. Gunakan
                                template import untuk memastikan format data dan
                                gunakan nama atau slug untuk kategori, brand,
                                dan unit jika ID tidak tersedia.
                            </alert_dialog_1.AlertDialogDescription>

                            <div className="mt-4 rounded-xl border border-border bg-muted p-4 text-sm text-foreground">
                                <p className="font-semibold">
                                    Format kolom yang didukung:
                                </p>
                                <ul className="mt-2 list-disc space-y-1 pl-5">
                                    <li>
                                        <strong>name</strong>,{' '}
                                        <strong>slug</strong>
                                    </li>
                                    <li>
                                        <strong>category_id</strong>,{' '}
                                        <strong>category_slug</strong>,{' '}
                                        <strong>category_name</strong>
                                    </li>
                                    <li>
                                        <strong>brand_id</strong>,{' '}
                                        <strong>brand_slug</strong>,{' '}
                                        <strong>brand_name</strong>
                                    </li>
                                    <li>
                                        <strong>unit_id</strong>,{' '}
                                        <strong>unit_code</strong>,{' '}
                                        <strong>unit_name</strong>
                                    </li>
                                    <li>
                                        <strong>condition</strong> (new /
                                        like_new / second)
                                    </li>
                                    <li>
                                        <strong>base_price</strong>,{' '}
                                        <strong>has_variant</strong> (0/1),{' '}
                                        <strong>is_publish</strong> (0/1)
                                    </li>
                                    <li>
                                        <strong>thumbnail</strong>,{' '}
                                        <strong>description</strong>,{' '}
                                        <strong>meta_title</strong>,{' '}
                                        <strong>meta_description</strong>
                                    </li>
                                </ul>
                            </div>

                            <alert_dialog_1.AlertDialogFooter>
                                <button_1.Button variant="outline" onClick={downloadImportTemplate}>
                                    Download Template
                                </button_1.Button>
                                <button_1.Button onClick={triggerImport}>
                                    Pilih File untuk Upload
                                </button_1.Button>
                                <alert_dialog_1.AlertDialogCancel onClick={closeImportDialog}>
                                    Batal
                                </alert_dialog_1.AlertDialogCancel>
                            </alert_dialog_1.AlertDialogFooter>
                        </alert_dialog_1.AlertDialogContent>
                    </alert_dialog_1.AlertDialog>
                </div>

                <hr />

                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard title="Total Product" value={summary.products} icon={lucide_react_1.Package}/>
                    <SummaryCard title="Total Product Variant" value={summary.product_variants} icon={lucide_react_1.Boxes}/>
                    <SummaryCard title="Total Brand" value={summary.brands} icon={lucide_react_1.Tags}/>
                    <SummaryCard title="Total Category Product" value={summary.categories} icon={lucide_react_1.Warehouse}/>
                </div>

                {/* FILTER */}
                <div className="justifty-between flex flex-wrap gap-3">
                    <div>
                        <input_1.Input className="max-w-xs" placeholder="Search product name..." value={search} onChange={function (e) { return setSearch(e.target.value); }} onKeyDown={function (e) {
            return e.key === 'Enter' && applyFilter();
        }}/>
                    </div>

                    <div>
                        <SearchableSelect_1.default className="min-w-56" options={categories.map(function (cat) { return ({
            value: cat.id,
            label: cat.name,
        }); })} value={categoryId} onChange={function (value) { return setCategoryId(value !== null && value !== void 0 ? value : ''); }} placeholder="All Categories" clearable/>
                    </div>

                    <div>
                        <SearchableSelect_1.default className="min-w-56" options={brands.map(function (brand) { return ({
            value: brand.id,
            label: brand.name,
        }); })} value={brandId} onChange={function (value) { return setBrandId(value !== null && value !== void 0 ? value : ''); }} placeholder="All Brands" clearable/>
                    </div>

                    <button_1.Button onClick={applyFilter}>Apply Filter</button_1.Button>
                </div>

                {/* TABLE */}
                <DataTable_1.DataTable data={products.data} columns={columns}/>

                {/* PAGINATION */}
                <div className="flex flex-wrap gap-2">
                    {products.links.map(function (link, i) { return (<button key={i} dangerouslySetInnerHTML={{
                __html: link.label,
            }} disabled={!link.url} onClick={function () { return link.url && react_1.router.visit(link.url); }} className={"rounded px-3 py-1 text-sm ".concat(link.active
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted', " ").concat(!link.url && 'opacity-50')}/>); })}
                </div>
            </div>

            {/* DELETE DIALOG */}
            <alert_dialog_1.AlertDialog open={!!deletingId} onOpenChange={function () { return setDeletingId(null); }}>
                <alert_dialog_1.AlertDialogContent>
                    <alert_dialog_1.AlertDialogHeader>
                        <alert_dialog_1.AlertDialogTitle>Delete Product?</alert_dialog_1.AlertDialogTitle>

                        <alert_dialog_1.AlertDialogDescription>
                            This action cannot be undone. The selected product
                            will be permanently deleted.
                        </alert_dialog_1.AlertDialogDescription>
                    </alert_dialog_1.AlertDialogHeader>

                    <alert_dialog_1.AlertDialogFooter>
                        <alert_dialog_1.AlertDialogCancel>Cancel</alert_dialog_1.AlertDialogCancel>

                        <alert_dialog_1.AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
                            Yes, Delete
                        </alert_dialog_1.AlertDialogAction>
                    </alert_dialog_1.AlertDialogFooter>
                </alert_dialog_1.AlertDialogContent>
            </alert_dialog_1.AlertDialog>
        </master_data_layout_1.default>);
}
