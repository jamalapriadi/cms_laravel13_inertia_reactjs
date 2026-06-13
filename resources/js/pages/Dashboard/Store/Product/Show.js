"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Show;
var react_1 = require("@inertiajs/react");
var lucide_react_1 = require("lucide-react");
var badge_1 = require("@/components/ui/badge");
var button_1 = require("@/components/ui/button");
var card_1 = require("@/components/ui/card");
var table_1 = require("@/components/ui/table");
var master_data_layout_1 = require("@/layouts/master-data-layout");
var media_1 = require("@/lib/media");
var money = function (value) {
    return "\u00A5".concat(Number(value !== null && value !== void 0 ? value : 0).toLocaleString('ja-JP'));
};
function Show(_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j;
    var product = _a.product;
    return (<master_data_layout_1.default>
            <react_1.Head title={product.name}/>

            <div className="container mx-auto space-y-8 px-6 py-10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <react_1.Link href="/my-admin/dashboard/ecommerce/products">
                            <button_1.Button size="icon" variant="secondary">
                                <lucide_react_1.ArrowLeft className="h-4 w-4"/>
                            </button_1.Button>
                        </react_1.Link>
                        <div>
                            <h1 className="text-2xl font-bold">
                                {product.name}
                            </h1>
                            <p className="text-muted-foreground">
                                {(_c = (_b = product.category) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : '-'} ·{' '}
                                {(_e = (_d = product.brand) === null || _d === void 0 ? void 0 : _d.name) !== null && _e !== void 0 ? _e : 'No brand'}
                            </p>
                        </div>
                    </div>
                    <react_1.Link href={"/my-admin/dashboard/ecommerce/products/".concat(product.id, "/edit")}>
                        <button_1.Button variant="secondary">Edit Product</button_1.Button>
                    </react_1.Link>
                </div>

                <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                    <card_1.Card>
                        <card_1.CardHeader>
                            <card_1.CardTitle className="flex items-center gap-2 text-base">
                                <lucide_react_1.Image className="h-4 w-4"/>
                                Product
                            </card_1.CardTitle>
                        </card_1.CardHeader>
                        <card_1.CardContent className="space-y-4">
                            {product.thumbnail ? (<img src={(0, media_1.mediaUrl)(product.thumbnail) || ''} alt={product.name} className="aspect-square w-full rounded-lg border object-cover"/>) : (<div className="flex aspect-square w-full items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                                    No Image
                                </div>)}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <span className="text-muted-foreground">
                                    Base Price
                                </span>
                                <span className="font-medium">
                                    {money(product.base_price)}
                                </span>
                                <span className="text-muted-foreground">
                                    SKU
                                </span>
                                <span className="font-medium">
                                    {product.sku || '-'}
                                </span>
                                <span className="text-muted-foreground">
                                    Condition
                                </span>
                                <span className="font-medium">
                                    {product.condition}
                                </span>
                                <span className="text-muted-foreground">
                                    Status
                                </span>
                                <badge_1.Badge variant={product.is_publish
            ? 'default'
            : 'secondary'}>
                                    {product.is_publish ? 'Published' : 'Draft'}
                                </badge_1.Badge>
                            </div>
                        </card_1.CardContent>
                    </card_1.Card>

                    <div className="space-y-6">
                        {product.has_variant ? (<>
                                <card_1.Card>
                                    <card_1.CardHeader className="flex flex-row items-center justify-between gap-4">
                                        <card_1.CardTitle className="flex items-center gap-2 text-base">
                                            <lucide_react_1.Layers className="h-4 w-4"/>
                                            Product Variants
                                        </card_1.CardTitle>
                                        <react_1.Link href={"/my-admin/dashboard/ecommerce/product-variants/create?product_id=".concat(product.id)}>
                                            <button_1.Button size="sm">
                                                <lucide_react_1.Plus className="h-4 w-4"/>
                                                Add Variant
                                            </button_1.Button>
                                        </react_1.Link>
                                    </card_1.CardHeader>
                                    <card_1.CardContent>
                                        <div className="space-y-3">
                                            {product.variants.map(function (variant) {
                var _a;
                return (<div key={variant.id} className="rounded-lg border bg-background p-4">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <p className="font-medium">
                                                            {variant.name}
                                                        </p>
                                                        <react_1.Link href={"/my-admin/dashboard/ecommerce/product-variants/".concat(variant.id, "/edit")}>
                                                            <button_1.Button size="sm" variant="secondary">
                                                                Edit
                                                            </button_1.Button>
                                                        </react_1.Link>
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {((_a = variant.options) !== null && _a !== void 0 ? _a : []).map(function (option) { return (<badge_1.Badge key={option.id} variant="secondary">
                                                                {option.value}
                                                            </badge_1.Badge>); })}
                                                    </div>
                                                </div>);
            })}
                                            {product.variants.length === 0 && (<p className="text-sm text-muted-foreground">
                                                    Belum ada variant untuk
                                                    produk ini.
                                                </p>)}
                                        </div>
                                    </card_1.CardContent>
                                </card_1.Card>

                                <card_1.Card>
                                    <card_1.CardHeader className="flex flex-row items-center justify-between gap-4">
                                        <card_1.CardTitle className="flex items-center gap-2 text-base">
                                            <lucide_react_1.Package className="h-4 w-4"/>
                                            Variant Items
                                        </card_1.CardTitle>
                                        <react_1.Link href={"/my-admin/dashboard/ecommerce/variant-items/create?product_id=".concat(product.id)}>
                                            <button_1.Button size="sm">
                                                <lucide_react_1.Plus className="h-4 w-4"/>
                                                Generate Items
                                            </button_1.Button>
                                        </react_1.Link>
                                    </card_1.CardHeader>
                                    <card_1.CardContent>
                                        <div className="overflow-x-auto rounded-lg border">
                                            <table_1.Table>
                                                <table_1.TableHeader>
                                                    <table_1.TableRow>
                                                        <table_1.TableHead>
                                                            Variant
                                                        </table_1.TableHead>
                                                        <table_1.TableHead>
                                                            SKU
                                                        </table_1.TableHead>
                                                        <table_1.TableHead>
                                                            Buying
                                                        </table_1.TableHead>
                                                        <table_1.TableHead>
                                                            Selling
                                                        </table_1.TableHead>
                                                        <table_1.TableHead>
                                                            Stock
                                                        </table_1.TableHead>
                                                        <table_1.TableHead>
                                                            Status
                                                        </table_1.TableHead>
                                                        <table_1.TableHead />
                                                    </table_1.TableRow>
                                                </table_1.TableHeader>
                                                <table_1.TableBody>
                                                    {product.variant_items.map(function (item) {
                var _a, _b;
                return (<table_1.TableRow key={item.id}>
                                                                <table_1.TableCell>
                                                                    <div>
                                                                        <p className="font-medium">
                                                                            {item.name}
                                                                        </p>
                                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                                            {((_a = item.options) !== null && _a !== void 0 ? _a : []).map(function (option) { return (<badge_1.Badge key={option.id} variant="secondary">
                                                                                        {option.value}
                                                                                    </badge_1.Badge>); })}
                                                                        </div>
                                                                    </div>
                                                                </table_1.TableCell>
                                                                <table_1.TableCell>
                                                                    {item.sku}
                                                                </table_1.TableCell>
                                                                <table_1.TableCell>
                                                                    {money(item.buying_price)}
                                                                </table_1.TableCell>
                                                                <table_1.TableCell>
                                                                    {money(item.selling_price)}
                                                                </table_1.TableCell>
                                                                <table_1.TableCell>
                                                                    {(_b = item.available_stock_units_count) !== null && _b !== void 0 ? _b : item.stock}
                                                                </table_1.TableCell>
                                                                <table_1.TableCell>
                                                                    <badge_1.Badge variant={item.is_active
                        ? 'default'
                        : 'destructive'}>
                                                                        {item.is_active
                        ? 'Active'
                        : 'Inactive'}
                                                                    </badge_1.Badge>
                                                                </table_1.TableCell>
                                                                <table_1.TableCell>
                                                                    <react_1.Link href={"/my-admin/dashboard/ecommerce/variant-items/".concat(item.id, "/edit")}>
                                                                        <button_1.Button size="sm" variant="secondary">
                                                                            Edit
                                                                        </button_1.Button>
                                                                    </react_1.Link>
                                                                </table_1.TableCell>
                                                            </table_1.TableRow>);
            })}
                                                    {product.variant_items
                .length === 0 && (<table_1.TableRow>
                                                            <table_1.TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                                                Belum ada SKU
                                                                combination.
                                                            </table_1.TableCell>
                                                        </table_1.TableRow>)}
                                                </table_1.TableBody>
                                            </table_1.Table>
                                        </div>
                                    </card_1.CardContent>
                                </card_1.Card>
                            </>) : (<card_1.Card>
                                <card_1.CardHeader className="flex flex-row items-center justify-between gap-4">
                                    <div>
                                        <card_1.CardTitle className="flex items-center gap-2 text-base">
                                            <lucide_react_1.Package className="h-4 w-4"/>
                                            Stock Units
                                        </card_1.CardTitle>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            Total Stock:{' '}
                                            {(_f = product.available_stock_units_count) !== null && _f !== void 0 ? _f : 0}{' '}
                                            Available /{' '}
                                            {(_g = product.stock_units_count) !== null && _g !== void 0 ? _g : 0}{' '}
                                            Total
                                        </p>
                                    </div>
                                    <react_1.Link href={"/my-admin/dashboard/ecommerce/product-stock-units/create?product_id=".concat(product.id)}>
                                        <button_1.Button size="sm">
                                            <lucide_react_1.Plus className="h-4 w-4"/>
                                            Add Stock Unit
                                        </button_1.Button>
                                    </react_1.Link>
                                </card_1.CardHeader>
                                <card_1.CardContent>
                                    <div className="overflow-x-auto rounded-lg border">
                                        <table_1.Table>
                                            <table_1.TableHeader>
                                                <table_1.TableRow>
                                                    <table_1.TableHead>
                                                        IMEI / Serial Number
                                                    </table_1.TableHead>
                                                    <table_1.TableHead>
                                                        Network
                                                    </table_1.TableHead>
                                                    <table_1.TableHead>
                                                        Status
                                                    </table_1.TableHead>
                                                    <table_1.TableHead>Note</table_1.TableHead>
                                                    <table_1.TableHead className="w-24"/>
                                                </table_1.TableRow>
                                            </table_1.TableHeader>
                                            <table_1.TableBody>
                                                {((_h = product.stock_units) !== null && _h !== void 0 ? _h : []).map(function (unit) { return (<table_1.TableRow key={unit.id}>
                                                        <table_1.TableCell className="font-mono font-medium">
                                                            {unit.imei_serial_number}
                                                        </table_1.TableCell>
                                                        <table_1.TableCell>
                                                            {unit.network_compatibility ? (<badge_1.Badge variant="outline">
                                                                    {unit.network_compatibility}
                                                                </badge_1.Badge>) : ('-')}
                                                        </table_1.TableCell>
                                                        <table_1.TableCell>
                                                            <badge_1.Badge variant={unit.status ===
                    'available'
                    ? 'default'
                    : 'secondary'}>
                                                                {unit.status}
                                                            </badge_1.Badge>
                                                        </table_1.TableCell>
                                                        <table_1.TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                                                            {unit.note || '-'}
                                                        </table_1.TableCell>
                                                        <table_1.TableCell>
                                                            <react_1.Link href={"/my-admin/dashboard/ecommerce/product-stock-units/".concat(unit.id, "/edit")}>
                                                                <button_1.Button size="sm" variant="secondary">
                                                                    Edit
                                                                </button_1.Button>
                                                            </react_1.Link>
                                                        </table_1.TableCell>
                                                    </table_1.TableRow>); })}
                                                {((_j = product.stock_units) !== null && _j !== void 0 ? _j : [])
                .length === 0 && (<table_1.TableRow>
                                                        <table_1.TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                                            Belum ada stok unit
                                                            terdaftar untuk
                                                            produk ini.
                                                        </table_1.TableCell>
                                                    </table_1.TableRow>)}
                                            </table_1.TableBody>
                                        </table_1.Table>
                                    </div>
                                </card_1.CardContent>
                            </card_1.Card>)}
                    </div>
                </div>
            </div>
        </master_data_layout_1.default>);
}
