"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Create;
var react_1 = require("@inertiajs/react");
var lucide_react_1 = require("lucide-react");
var react_2 = require("react");
var SearchableSelect_1 = require("@/components/SearchableSelect");
var button_1 = require("@/components/ui/button");
var checkbox_1 = require("@/components/ui/checkbox");
var input_1 = require("@/components/ui/input");
var label_1 = require("@/components/ui/label");
var textarea_1 = require("@/components/ui/textarea");
var networkOptions = [
    ['sim_free', 'All Operator'],
    ['docomo', 'Docomo'],
    ['au', 'AU'],
    ['softbank', 'SoftBank'],
    ['rakuten', 'Rakuten'],
    ['mineo', 'Mineo'],
];
function Create(_a) {
    var _b, _c;
    var products = _a.products;
    var urlParams = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : null;
    var defaultProductId = (urlParams === null || urlParams === void 0 ? void 0 : urlParams.get('product_id')) || '';
    var _d = (0, react_2.useState)(false), hasNetwork = _d[0], setHasNetwork = _d[1];
    var _e = (0, react_1.useForm)({
        product_id: defaultProductId,
        product_variant_id: '',
        imei_serial_number: '',
        network_compatibility: null,
        status: 'available',
        note: '',
    }), data = _e.data, setData = _e.setData, transform = _e.transform, post = _e.post, processing = _e.processing, errors = _e.errors;
    var selectedProduct = products.find(function (p) { return p.id === data.product_id; });
    var showVariantSelect = (_b = selectedProduct === null || selectedProduct === void 0 ? void 0 : selectedProduct.has_variant) !== null && _b !== void 0 ? _b : false;
    // Reset variant item if selected product has no variants
    (0, react_2.useEffect)(function () {
        if (selectedProduct && !selectedProduct.has_variant) {
            setData('product_variant_id', '');
        }
    }, [data.product_id]);
    var handleSubmit = function (event) {
        event.preventDefault();
        transform(function (formData) { return (__assign(__assign({}, formData), { network_compatibility: hasNetwork
                ? formData.network_compatibility || 'sim_free'
                : null, product_variant_id: showVariantSelect
                ? formData.product_variant_id || null
                : null })); });
        post('/dashboard/ecommerce/product-stock-units');
    };
    return (<>
            <react_1.Head title="Create Stok Unit"/>

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex items-center gap-4">
                    <react_1.Link href="/dashboard/ecommerce/product-stock-units">
                        <button_1.Button variant="outline" size="sm">
                            <lucide_react_1.ArrowLeft className="h-4 w-4"/>
                        </button_1.Button>
                    </react_1.Link>
                    <div>
                        <h1 className="text-2xl font-bold">Create Stok Unit</h1>
                        <p className="text-sm text-muted-foreground">
                            Tambahkan IMEI/serial unit untuk produk.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label_1.Label>Product</label_1.Label>
                            <SearchableSelect_1.default options={products.map(function (product) { return ({
            value: product.id,
            label: product.name,
        }); })} value={data.product_id} onChange={function (value) {
            return setData('product_id', value !== null && value !== void 0 ? value : '');
        }} placeholder="-- Select Product --" error={errors.product_id}/>
                            {selectedProduct &&
            !selectedProduct.has_variant && (<p className="text-xs text-muted-foreground">
                                        SKU produk: {selectedProduct.sku || '-'}
                                    </p>)}
                        </div>

                        {showVariantSelect && (<div className="space-y-2">
                                <label_1.Label>Product Variant Item</label_1.Label>
                                <SearchableSelect_1.default options={((_c = selectedProduct === null || selectedProduct === void 0 ? void 0 : selectedProduct.variant_items) !== null && _c !== void 0 ? _c : []).map(function (variant) { return ({
                value: variant.id,
                label: variant.name,
                description: variant.sku,
            }); })} value={data.product_variant_id} onChange={function (value) {
                return setData('product_variant_id', value !== null && value !== void 0 ? value : '');
            }} placeholder="-- Select Variant Item --" error={errors.product_variant_id}/>
                            </div>)}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label_1.Label>IMEI / Serial Number</label_1.Label>
                            <input_1.Input value={data.imei_serial_number} onChange={function (e) {
            return setData('imei_serial_number', e.target.value);
        }} placeholder="e.g., 351234567890123" required/>
                            {errors.imei_serial_number && (<p className="text-xs text-destructive">
                                    {errors.imei_serial_number}
                                </p>)}
                        </div>

                        <div className="space-y-2">
                            <label_1.Label>Status</label_1.Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={data.status} onChange={function (e) {
            return setData('status', e.target.value);
        }}>
                                <option value="available">Available</option>
                                <option value="reserved">Reserved</option>
                                <option value="sold">Sold</option>
                                <option value="damaged">Damaged</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-medium">
                            <checkbox_1.Checkbox checked={hasNetwork} onCheckedChange={function (checked) {
            var enabled = checked === true;
            setHasNetwork(enabled);
            setData('network_compatibility', enabled
                ? data.network_compatibility ||
                    'sim_free'
                : null);
        }}/>
                            Ada network
                        </label>

                        {hasNetwork && (<div className="space-y-2">
                                <label_1.Label>Network</label_1.Label>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {networkOptions.map(function (_a) {
                var value = _a[0], label = _a[1];
                var selected = data.network_compatibility ===
                    value;
                return (<button key={value} type="button" onClick={function () {
                        return setData('network_compatibility', value);
                    }} className={"rounded-md border px-3 py-2 text-sm font-medium transition ".concat(selected
                        ? value === 'sim_free'
                            ? 'border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'border-red-500 bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                        : 'border-border bg-card text-muted-foreground hover:border-border')}>
                                                {label}
                                            </button>);
            })}
                                </div>
                            </div>)}
                        {errors.network_compatibility && (<p className="text-xs text-destructive">
                                {errors.network_compatibility}
                            </p>)}
                    </div>

                    <div className="space-y-2">
                        <label_1.Label>Note</label_1.Label>
                        <textarea_1.default rows={3} value={data.note} onChange={function (e) { return setData('note', e.target.value); }} placeholder="Optional internal note..."/>
                    </div>

                    <div className="flex justify-between gap-3">
                        <react_1.Link href="/dashboard/ecommerce/product-stock-units">
                            <button_1.Button type="button" variant="outline">
                                Cancel
                            </button_1.Button>
                        </react_1.Link>
                        <button_1.Button type="submit" disabled={processing}>
                            Save Stok Unit
                        </button_1.Button>
                    </div>
                </form>
            </div>
        </>);
}
