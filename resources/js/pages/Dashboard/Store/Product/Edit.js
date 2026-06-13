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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Edit;
var zod_1 = require("@hookform/resolvers/zod");
var react_1 = require("@inertiajs/react");
var react_2 = require("react");
var react_hook_form_1 = require("react-hook-form");
var sonner_1 = require("sonner");
var zod_2 = require("zod");
var MediaImagePicker_1 = require("@/components/media/MediaImagePicker");
var SearchableSelect_1 = require("@/components/SearchableSelect");
var button_1 = require("@/components/ui/button");
var checkbox_1 = require("@/components/ui/checkbox");
var input_1 = require("@/components/ui/input");
var label_1 = require("@/components/ui/label");
var textarea_1 = require("@/components/ui/textarea");
var TinyEditor_1 = require("@/components/ui/TinyEditor");
var master_data_layout_1 = require("@/layouts/master-data-layout");
var productSchema = zod_2.z.object({
    name: zod_2.z.string().min(3, 'Product name must be at least 3 characters'),
    category_id: zod_2.z.string().min(1, 'Category is required'),
    brand_id: zod_2.z.string().nullable().optional(),
    unit_id: zod_2.z.string().nullable().optional(),
    sku: zod_2.z.string().nullable().optional(),
    thumbnail: zod_2.z.any().optional(),
    description: zod_2.z.string().nullable().optional(),
    condition: zod_2.z.enum(['new', 'like_new', 'second']).default('new'),
    base_price: zod_2.z.coerce
        .number()
        .min(0, 'Price must be greater than or equal to 0')
        .default(0),
    has_variant: zod_2.z.boolean().default(false),
    meta_title: zod_2.z.string().nullable().optional(),
    meta_description: zod_2.z.string().nullable().optional(),
    is_publish: zod_2.z.boolean().default(true),
});
function Edit(_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    var initialProduct = _a.product, categories = _a.categories, brands = _a.brands, units = _a.units;
    var _t = (0, react_2.useState)(false), processing = _t[0], setProcessing = _t[1];
    var _u = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(productSchema),
        defaultValues: {
            name: (_b = initialProduct.name) !== null && _b !== void 0 ? _b : '',
            category_id: (_c = initialProduct.category_id) !== null && _c !== void 0 ? _c : '',
            brand_id: (_d = initialProduct.brand_id) !== null && _d !== void 0 ? _d : null,
            unit_id: (_e = initialProduct.unit_id) !== null && _e !== void 0 ? _e : null,
            sku: (_f = initialProduct.sku) !== null && _f !== void 0 ? _f : '',
            thumbnail: (_g = initialProduct.thumbnail) !== null && _g !== void 0 ? _g : undefined,
            description: (_h = initialProduct.description) !== null && _h !== void 0 ? _h : '',
            condition: (_j = initialProduct.condition) !== null && _j !== void 0 ? _j : 'new',
            base_price: (_k = initialProduct.base_price) !== null && _k !== void 0 ? _k : 0,
            has_variant: Boolean(initialProduct.has_variant),
            meta_title: (_l = initialProduct.meta_title) !== null && _l !== void 0 ? _l : '',
            meta_description: (_m = initialProduct.meta_description) !== null && _m !== void 0 ? _m : '',
            is_publish: Boolean(initialProduct.is_publish),
        },
    }), register = _u.register, handleSubmit = _u.handleSubmit, setValue = _u.setValue, watch = _u.watch, errors = _u.formState.errors;
    var hasVariant = watch('has_variant');
    (0, react_2.useEffect)(function () {
        register('description');
        register('thumbnail');
    }, [register]);
    (0, react_2.useEffect)(function () {
        if (hasVariant) {
            setValue('sku', '', { shouldValidate: true });
        }
    }, [hasVariant, setValue]);
    var onSubmit = function (data) {
        var thumbnail = data.thumbnail, productData = __rest(data, ["thumbnail"]);
        var payload = thumbnail !== undefined
            ? __assign(__assign({}, productData), { thumbnail: thumbnail }) : productData;
        react_1.router.post("/my-admin/dashboard/ecommerce/products/".concat(initialProduct.id), __assign({ _method: 'put' }, payload), {
            forceFormData: true,
            preserveScroll: true,
            onStart: function () {
                setProcessing(true);
                sonner_1.toast.loading('Updating product...', { id: 'update' });
            },
            onSuccess: function () {
                sonner_1.toast.success('Product updated successfully!', {
                    id: 'update',
                });
            },
            onError: function () {
                sonner_1.toast.error('Failed to update product.', { id: 'update' });
            },
            onFinish: function () {
                setProcessing(false);
            },
        });
    };
    return (<master_data_layout_1.default>
            <react_1.Head title="Edit Product"/>

            <div className="container mx-auto space-y-6 px-6 py-10">
                <div>
                    <h1 className="text-2xl font-bold">Edit Product</h1>
                    <p className="text-muted-foreground">Edit product data</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="container space-y-6 rounded-xl bg-card p-6 shadow">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label_1.Label>Product Name</label_1.Label>
                                <input_1.Input type="text" aria-invalid={!!errors.name} {...register('name')} placeholder="e.g., iPhone 15 Pro Max"/>
                                {errors.name && (<p className="text-sm text-destructive">
                                        {errors.name.message}
                                    </p>)}
                            </div>

                            <div className="flex flex-col gap-1">
                                <label_1.Label>
                                    SKU (only for products without variants)
                                </label_1.Label>
                                <input_1.Input type="text" aria-invalid={!!errors.sku} {...register('sku')} placeholder="e.g., IP15-BASE" disabled={hasVariant}/>
                                {errors.sku && (<p className="text-sm text-destructive">
                                        {errors.sku.message}
                                    </p>)}
                            </div>

                            <div className="flex flex-col gap-1">
                                <label_1.Label>Category</label_1.Label>
                                <SearchableSelect_1.default options={categories.map(function (cat) { return ({
            value: cat.id,
            label: cat.name,
        }); })} value={watch('category_id')} onChange={function (value) {
            return setValue('category_id', value !== null && value !== void 0 ? value : '', {
                shouldValidate: true,
            });
        }} placeholder="-- Select Category --" error={(_o = errors.category_id) === null || _o === void 0 ? void 0 : _o.message}/>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label_1.Label>Brand Optional</label_1.Label>
                                <SearchableSelect_1.default options={brands.map(function (brand) { return ({
            value: brand.id,
            label: brand.name,
        }); })} value={(_p = watch('brand_id')) !== null && _p !== void 0 ? _p : ''} onChange={function (value) {
            return setValue('brand_id', value || null, {
                shouldValidate: true,
            });
        }} placeholder="-- No Brand --" error={(_q = errors.brand_id) === null || _q === void 0 ? void 0 : _q.message} clearable/>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label_1.Label>Unit Optional</label_1.Label>
                                <SearchableSelect_1.default options={units.map(function (unit) { return ({
            value: unit.id,
            label: unit.name,
            description: unit.code,
        }); })} value={(_r = watch('unit_id')) !== null && _r !== void 0 ? _r : ''} onChange={function (value) {
            return setValue('unit_id', value || null, {
                shouldValidate: true,
            });
        }} placeholder="-- No Unit --" error={(_s = errors.unit_id) === null || _s === void 0 ? void 0 : _s.message} clearable/>
                            </div>

                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label_1.Label>Thumbnail</label_1.Label>
                                <MediaImagePicker_1.default value={watch('thumbnail')} onChange={function (path) {
            return setValue('thumbnail', path, {
                shouldValidate: true,
            });
        }}/>
                            </div>

                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label_1.Label>Description</label_1.Label>
                                <TinyEditor_1.default value={watch('description') || ''} onChange={function (val) {
            return setValue('description', val, {
                shouldValidate: true,
            });
        }}/>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label_1.Label>Base Price ¥</label_1.Label>
                                <input_1.Input type="number" min="0" aria-invalid={!!errors.base_price} {...register('base_price')}/>
                                {errors.base_price && (<p className="text-sm text-destructive">
                                        {errors.base_price.message}
                                    </p>)}
                            </div>

                            <div className="flex flex-col gap-1">
                                <label_1.Label>Condition</label_1.Label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('condition')}>
                                    <option value="new">New</option>
                                    <option value="like_new">Like New</option>
                                    <option value="second">
                                        Second / Used
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="flex flex-col gap-1">
                                <label_1.Label>Meta Title SEO</label_1.Label>
                                <input_1.Input type="text" aria-invalid={!!errors.meta_title} {...register('meta_title')} placeholder="SEO Title..."/>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label_1.Label>Meta Description SEO</label_1.Label>
                                <textarea_1.default aria-invalid={!!errors.meta_description} {...register('meta_description')} placeholder="SEO Description..." rows={3}/>
                            </div>
                        </div>

                        <hr className="my-6"/>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <checkbox_1.Checkbox id="has_variant" checked={watch('has_variant')} onCheckedChange={function (checked) {
            return setValue('has_variant', Boolean(checked));
        }}/>
                                <label_1.Label htmlFor="has_variant">
                                    Product has variants
                                </label_1.Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <checkbox_1.Checkbox id="is_publish" checked={watch('is_publish')} onCheckedChange={function (checked) {
            return setValue('is_publish', Boolean(checked));
        }}/>
                                <label_1.Label htmlFor="is_publish">
                                    Publish immediately
                                </label_1.Label>
                            </div>
                        </div>
                    </div>

                    <div className="container flex justify-between">
                        <button_1.Button type="button" variant="outline" onClick={function () {
            return react_1.router.visit('/my-admin/dashboard/ecommerce/products');
        }}>
                            Cancel
                        </button_1.Button>

                        <button_1.Button type="submit" disabled={processing}>
                            {processing ? 'Please wait...' : 'Update Product'}
                        </button_1.Button>
                    </div>
                </form>
            </div>
        </master_data_layout_1.default>);
}
