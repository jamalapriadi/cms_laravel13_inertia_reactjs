"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Create;
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
    base_price: zod_2.z.coerce.number().min(0).default(0),
    has_variant: zod_2.z.boolean().default(false),
    meta_title: zod_2.z.string().nullable().optional(),
    meta_description: zod_2.z.string().nullable().optional(),
    is_publish: zod_2.z.boolean().default(true),
});
function Create(_a) {
    var _b, _c, _d, _e, _f;
    var categories = _a.categories, brands = _a.brands, units = _a.units;
    var _g = (0, react_2.useState)(false), processing = _g[0], setProcessing = _g[1];
    var _h = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(productSchema),
        defaultValues: {
            name: '',
            category_id: '',
            unit_id: null,
            brand_id: null,
            sku: '',
            description: '',
            condition: 'new',
            base_price: 0,
            has_variant: false,
            meta_title: '',
            meta_description: '',
            is_publish: true,
        },
    }), register = _h.register, handleSubmit = _h.handleSubmit, setValue = _h.setValue, watch = _h.watch, errors = _h.formState.errors;
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
        react_1.router.post('/my-admin/dashboard/ecommerce/products', data, {
            forceFormData: true,
            preserveScroll: true,
            onStart: function () {
                setProcessing(true);
                sonner_1.toast.loading('Saving product...', { id: 'save' });
            },
            onSuccess: function () {
                sonner_1.toast.success('Product created successfully!', { id: 'save' });
            },
            onError: function () {
                sonner_1.toast.error('Failed to create product. Please check the inputs.', {
                    id: 'save',
                });
            },
            onFinish: function () {
                setProcessing(false);
            },
        });
    };
    return (<master_data_layout_1.default>
            <react_1.Head title="Create Product"/>

            <div className="container mx-auto space-y-10 px-6 py-10">
                <div>
                    <h1 className="text-2xl font-bold">Create Product</h1>
                    <p className="text-muted-foreground">
                        Add a new product to the store
                    </p>
                </div>

                <hr />

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
        }} placeholder="-- Select Category --" error={(_b = errors.category_id) === null || _b === void 0 ? void 0 : _b.message}/>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label_1.Label>Brand Optional</label_1.Label>
                                <SearchableSelect_1.default options={brands.map(function (brand) { return ({
            value: brand.id,
            label: brand.name,
        }); })} value={(_c = watch('brand_id')) !== null && _c !== void 0 ? _c : ''} onChange={function (value) {
            return setValue('brand_id', value || null, {
                shouldValidate: true,
            });
        }} placeholder="-- No Brand --" error={(_d = errors.brand_id) === null || _d === void 0 ? void 0 : _d.message} clearable/>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label_1.Label>Unit Optional</label_1.Label>
                                <SearchableSelect_1.default options={units.map(function (unit) { return ({
            value: unit.id,
            label: unit.name,
            description: unit.code,
        }); })} value={(_e = watch('unit_id')) !== null && _e !== void 0 ? _e : ''} onChange={function (value) {
            return setValue('unit_id', value || null, {
                shouldValidate: true,
            });
        }} placeholder="-- No Unit --" error={(_f = errors.unit_id) === null || _f === void 0 ? void 0 : _f.message} clearable/>
                            </div>

                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label_1.Label>Thumbnail</label_1.Label>
                                <MediaImagePicker_1.default value={watch('thumbnail')} onChange={function (path) {
            return setValue('thumbnail', path, {
                shouldValidate: true,
            });
        }}/>
                                {errors.thumbnail && (<p className="text-sm text-destructive">
                                        {errors.thumbnail.message}
                                    </p>)}
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
                                <input_1.Input type="number" min="0" {...register('base_price')}/>
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
                                <input_1.Input {...register('meta_title')}/>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label_1.Label>Meta Description SEO</label_1.Label>
                                <textarea_1.default {...register('meta_description')} rows={3}/>
                            </div>
                        </div>

                        <hr className="my-6"/>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <checkbox_1.Checkbox id="has_variant" checked={watch('has_variant')} onCheckedChange={function (checked) {
            return setValue('has_variant', !!checked);
        }}/>
                                <label_1.Label htmlFor="has_variant">
                                    Product has variants
                                </label_1.Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <checkbox_1.Checkbox id="is_publish" checked={watch('is_publish')} onCheckedChange={function (checked) {
            return setValue('is_publish', !!checked);
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
                            {processing ? 'Please wait...' : 'Create Product'}
                        </button_1.Button>
                    </div>
                </form>
            </div>
        </master_data_layout_1.default>);
}
