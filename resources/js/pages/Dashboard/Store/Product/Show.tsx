import { zodResolver } from '@hookform/resolvers/zod';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Pencil,
    Image as ImageIcon,
    FileText,
    Check,
    AlertCircle,
    Eye,
    Star,
    Layers,
    Boxes,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import Textarea from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import AppLayout from '@/layouts/master-data-layout';

/**
 * TYPES
 */
interface ProductImage {
    id: string;
    image: string;
    is_primary: boolean;
    sort_order: number;
}

interface ProductSpecification {
    id: string;
    spec_name: string;
    spec_value: string;
}

interface ProductVariant {
    id: string;
    product_id: string;
    name: string;
    sku: string;
    image?: string | null;
    price: string | number;
    track_stock: boolean;
    stock: number;
    available_stock_units_count?: number;
    min_stock_alert?: number | null;
    weight?: string | number | null;
    cost_price?: string | number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    stock_units?: ProductStockUnit[];
}

type NetworkCompatibility =
    | 'sim_free'
    | 'docomo'
    | 'au'
    | 'softbank'
    | 'rakuten'
    | 'mineo';

interface ProductStockUnit {
    id: string;
    product_variant_id: string;
    imei_serial_number: string;
    network_compatibility: NetworkCompatibility | null;
    status: 'available' | 'reserved' | 'sold' | 'damaged';
    note?: string | null;
}

interface Product {
    id: string;
    category_id: string;
    brand_id?: string | null;
    name: string;
    slug: string;
    thumbnail?: string | null;
    description?: string | null;
    condition: 'new' | 'like_new' | 'second';
    base_price: string | number;
    has_variant: boolean;
    meta_title?: string | null;
    meta_description?: string | null;
    is_publish: boolean;
    created_at: string;
    updated_at: string;
    category?: {
        id: string;
        name: string;
    };
    brand?: {
        id: string;
        name: string;
    };
    images: ProductImage[];
    specifications: ProductSpecification[];
    variants: ProductVariant[];
}

interface Props {
    product: Product;
}

/**
 * SCHEMAS FOR MODAL FORMS
 */
const specificationSchema = z.object({
    product_id: z.string().min(1, 'Product ID is required'),
    spec_name: z.string().min(1, 'Specification name is required').max(255),
    spec_value: z.string().min(1, 'Specification value is required'),
});

const imageSchema = z.object({
    product_id: z.string().min(1, 'Product ID is required'),
    image: z
        .any()
        .refine((file) => file instanceof File, 'Image file is required'),
    is_primary: z.boolean().default(false),
    sort_order: z.coerce
        .number()
        .min(0, 'Sort order cannot be negative')
        .default(0),
});

const variantSchema = z.object({
    product_id: z.string().min(1, 'Product ID is required'),
    name: z.string().min(1, 'Variant name is required').max(255),
    sku: z.string().min(1, 'SKU is required').max(255),
    image: z.any().optional(),
    price: z.coerce.number().min(0, 'Price must be greater than or equal to 0'),
    track_stock: z.boolean().default(true),
    min_stock_alert: z.preprocess(
        (val) => (val === '' || val === null ? null : Number(val)),
        z.number().int().min(0).nullable().optional(),
    ),
    weight: z.preprocess(
        (val) => (val === '' || val === null ? null : Number(val)),
        z.number().min(0).nullable().optional(),
    ),
    cost_price: z.preprocess(
        (val) => (val === '' || val === null ? null : Number(val)),
        z.number().min(0).nullable().optional(),
    ),
    is_active: z.boolean().default(true),
});

const stockUnitSchema = z.object({
    product_variant_id: z.string().min(1, 'Product variant is required'),
    imei_serial_number: z
        .string()
        .min(1, 'IMEI / Serial Number is required')
        .max(255),
    network_compatibility: z
        .enum(['sim_free', 'docomo', 'au', 'softbank', 'rakuten', 'mineo'])
        .nullable()
        .optional(),
    status: z
        .enum(['available', 'reserved', 'sold', 'damaged'])
        .default('available'),
    note: z.string().nullable().optional(),
});

type SpecificationFormData = z.infer<typeof specificationSchema>;
type ImageFormData = z.infer<typeof imageSchema>;
type VariantFormData = z.infer<typeof variantSchema>;
type StockUnitFormData = z.infer<typeof stockUnitSchema>;

const networkOptions: { value: NetworkCompatibility; label: string }[] = [
    { value: 'sim_free', label: 'SIM Free' },
    { value: 'docomo', label: 'Docomo' },
    { value: 'au', label: 'AU' },
    { value: 'softbank', label: 'SoftBank' },
    { value: 'rakuten', label: 'Rakuten' },
    { value: 'mineo', label: 'Mineo' },
];

const networkLabel = (network?: NetworkCompatibility | null) =>
    network
        ? (networkOptions.find((option) => option.value === network)?.label ??
          network)
        : '-';

export default function Show({ product }: Props) {
    // Modal states
    const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
    const [isStockUnitModalOpen, setIsStockUnitModalOpen] = useState(false);

    // Variant editing state
    const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(
        null,
    );
    const [editingStockUnit, setEditingStockUnit] =
        useState<ProductStockUnit | null>(null);
    const [stockUnitHasNetwork, setStockUnitHasNetwork] = useState(false);

    // Delete states
    const [deletingType, setDeletingType] = useState<
        'product' | 'image' | 'spec' | 'variant' | 'stockUnit' | null
    >(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Processing states
    const [submittingSpec, setSubmittingSpec] = useState(false);
    const [submittingImage, setSubmittingImage] = useState(false);
    const [submittingVariant, setSubmittingVariant] = useState(false);
    const [submittingStockUnit, setSubmittingStockUnit] = useState(false);

    /**
     * FORMS INITIALIZATION
     */
    const specForm = useForm<
        z.input<typeof specificationSchema>,
        unknown,
        SpecificationFormData
    >({
        resolver: zodResolver(specificationSchema),
        defaultValues: {
            product_id: product.id,
            spec_name: '',
            spec_value: '',
        },
    });

    const imageForm = useForm<
        z.input<typeof imageSchema>,
        unknown,
        ImageFormData
    >({
        resolver: zodResolver(imageSchema),
        defaultValues: {
            product_id: product.id,
            is_primary: false,
            sort_order: 0,
        },
    });

    const variantForm = useForm<
        z.input<typeof variantSchema>,
        unknown,
        VariantFormData
    >({
        resolver: zodResolver(variantSchema),
        defaultValues: {
            product_id: product.id,
            name: '',
            sku: '',
            image: undefined,
            price: 0,
            track_stock: true,
            min_stock_alert: null,
            weight: null,
            cost_price: null,
            is_active: true,
        },
    });

    const stockUnitForm = useForm<
        z.input<typeof stockUnitSchema>,
        unknown,
        StockUnitFormData
    >({
        resolver: zodResolver(stockUnitSchema),
        defaultValues: {
            product_variant_id: '',
            imei_serial_number: '',
            network_compatibility: null,
            status: 'available',
            note: '',
        },
    });

    /**
     * ACTIONS
     */
    const triggerCreateVariant = () => {
        setEditingVariant(null);
        variantForm.reset({
            product_id: product.id,
            name: '',
            sku: '',
            image: undefined,
            price: 0,
            track_stock: true,
            min_stock_alert: null,
            weight: null,
            cost_price: null,
            is_active: true,
        });
        setIsVariantModalOpen(true);
    };

    const triggerEditVariant = (variant: ProductVariant) => {
        setEditingVariant(variant);
        variantForm.reset({
            product_id: product.id,
            name: variant.name,
            sku: variant.sku,
            image: undefined,
            price: Number(variant.price),
            track_stock: !!variant.track_stock,
            min_stock_alert:
                variant.min_stock_alert !== null &&
                variant.min_stock_alert !== undefined
                    ? Number(variant.min_stock_alert)
                    : null,
            weight:
                variant.weight !== null && variant.weight !== undefined
                    ? Number(variant.weight)
                    : null,
            cost_price:
                variant.cost_price !== null && variant.cost_price !== undefined
                    ? Number(variant.cost_price)
                    : null,
            is_active: !!variant.is_active,
        });
        setIsVariantModalOpen(true);
    };

    const triggerCreateStockUnit = (variant: ProductVariant) => {
        setEditingStockUnit(null);
        stockUnitForm.reset({
            product_variant_id: variant.id,
            imei_serial_number: '',
            network_compatibility: null,
            status: 'available',
            note: '',
        });
        setStockUnitHasNetwork(false);
        setIsStockUnitModalOpen(true);
    };

    const triggerEditStockUnit = (stockUnit: ProductStockUnit) => {
        setEditingStockUnit(stockUnit);
        stockUnitForm.reset({
            product_variant_id: stockUnit.product_variant_id,
            imei_serial_number: stockUnit.imei_serial_number,
            network_compatibility: stockUnit.network_compatibility,
            status: stockUnit.status,
            note: stockUnit.note ?? '',
        });
        setStockUnitHasNetwork(!!stockUnit.network_compatibility);
        setIsStockUnitModalOpen(true);
    };

    const onAddSpecification = (data: SpecificationFormData) => {
        router.post('/dashboard/ecommerce/product-specifications', data, {
            preserveScroll: true,
            onStart: () => {
                setSubmittingSpec(true);
                toast.loading('Adding specification...', { id: 'spec' });
            },
            onSuccess: () => {
                toast.success('Specification added successfully!', {
                    id: 'spec',
                });
                setIsSpecModalOpen(false);
                specForm.reset({
                    product_id: product.id,
                    spec_name: '',
                    spec_value: '',
                });
            },
            onError: (errors) => {
                toast.error('Failed to add specification.', { id: 'spec' });
                console.error(errors);
            },
            onFinish: () => {
                setSubmittingSpec(false);
            },
        });
    };

    const onAddImage = (data: ImageFormData) => {
        router.post('/dashboard/ecommerce/product-images', data, {
            preserveScroll: true,
            onStart: () => {
                setSubmittingImage(true);
                toast.loading('Uploading image...', { id: 'image' });
            },
            onSuccess: () => {
                toast.success('Image uploaded successfully!', { id: 'image' });
                setIsImageModalOpen(false);
                imageForm.reset({
                    product_id: product.id,
                    is_primary: false,
                    sort_order: 0,
                });
            },
            onError: (errors) => {
                toast.error('Failed to upload image.', { id: 'image' });
                console.error(errors);
            },
            onFinish: () => {
                setSubmittingImage(false);
            },
        });
    };

    const onSaveVariant = (data: VariantFormData) => {
        if (editingVariant) {
            router.post(
                `/dashboard/ecommerce/product-variants/${editingVariant.id}`,
                { _method: 'put', ...data },
                {
                    forceFormData: true,
                    preserveScroll: true,
                    onStart: () => {
                        setSubmittingVariant(true);
                        toast.loading('Updating product variant...', {
                            id: 'variant',
                        });
                    },
                    onSuccess: () => {
                        toast.success('Product variant updated successfully!', {
                            id: 'variant',
                        });
                        setIsVariantModalOpen(false);
                        setEditingVariant(null);
                    },
                    onError: (errors) => {
                        toast.error(
                            'Failed to update product variant. Check unique SKU.',
                            { id: 'variant' },
                        );
                        console.error(errors);
                    },
                    onFinish: () => {
                        setSubmittingVariant(false);
                    },
                },
            );
        } else {
            router.post('/dashboard/ecommerce/product-variants', data, {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => {
                    setSubmittingVariant(true);
                    toast.loading('Creating product variant...', {
                        id: 'variant',
                    });
                },
                onSuccess: () => {
                    toast.success('Product variant created successfully!', {
                        id: 'variant',
                    });
                    setIsVariantModalOpen(false);
                },
                onError: (errors) => {
                    toast.error(
                        'Failed to create product variant. Check unique SKU.',
                        { id: 'variant' },
                    );
                    console.error(errors);
                },
                onFinish: () => {
                    setSubmittingVariant(false);
                },
            });
        }
    };

    const onSaveStockUnit = (data: StockUnitFormData) => {
        const payload = {
            ...data,
            network_compatibility: stockUnitHasNetwork
                ? data.network_compatibility || 'sim_free'
                : null,
        };

        if (editingStockUnit) {
            router.put(
                `/dashboard/ecommerce/product-stock-units/${editingStockUnit.id}`,
                payload,
                {
                    preserveScroll: true,
                    onStart: () => {
                        setSubmittingStockUnit(true);
                        toast.loading('Updating stock unit...', {
                            id: 'stock-unit',
                        });
                    },
                    onSuccess: () => {
                        toast.success('Stock unit updated successfully!', {
                            id: 'stock-unit',
                        });
                        setIsStockUnitModalOpen(false);
                        setEditingStockUnit(null);
                    },
                    onError: () => {
                        toast.error(
                            'Failed to update stock unit. Check IMEI uniqueness.',
                            { id: 'stock-unit' },
                        );
                    },
                    onFinish: () => {
                        setSubmittingStockUnit(false);
                    },
                },
            );
        } else {
            router.post('/dashboard/ecommerce/product-stock-units', payload, {
                preserveScroll: true,
                onStart: () => {
                    setSubmittingStockUnit(true);
                    toast.loading('Adding stock unit...', { id: 'stock-unit' });
                },
                onSuccess: () => {
                    toast.success('Stock unit added successfully!', {
                        id: 'stock-unit',
                    });
                    setIsStockUnitModalOpen(false);
                },
                onError: () => {
                    toast.error(
                        'Failed to add stock unit. Check IMEI uniqueness.',
                        { id: 'stock-unit' },
                    );
                },
                onFinish: () => {
                    setSubmittingStockUnit(false);
                },
            });
        }
    };

    const handleDelete = () => {
        if (!deletingId || !deletingType) return;

        const toastId = 'delete-' + deletingType;

        let url = '';
        if (deletingType === 'product') {
            url = `/dashboard/ecommerce/products/${deletingId}`;
        } else if (deletingType === 'image') {
            url = `/dashboard/ecommerce/product-images/${deletingId}`;
        } else if (deletingType === 'spec') {
            url = `/dashboard/ecommerce/product-specifications/${deletingId}`;
        } else if (deletingType === 'variant') {
            url = `/dashboard/ecommerce/product-variants/${deletingId}`;
        } else if (deletingType === 'stockUnit') {
            url = `/dashboard/ecommerce/product-stock-units/${deletingId}`;
        }

        router.delete(url, {
            preserveScroll: true,
            onStart: () => {
                toast.loading(`Deleting ${deletingType}...`, { id: toastId });
            },
            onSuccess: () => {
                toast.success(
                    `${deletingType.charAt(0).toUpperCase() + deletingType.slice(1)} deleted successfully!`,
                    { id: toastId },
                );
                setDeletingId(null);
                setDeletingType(null);
                if (deletingType === 'product') {
                    router.visit('/dashboard/ecommerce/products');
                }
            },
            onError: () => {
                toast.error(`Failed to delete ${deletingType}.`, {
                    id: toastId,
                });
            },
            onFinish: () => {
                setDeletingId(null);
                setDeletingType(null);
            },
        });
    };

    const triggerDelete = (
        type: 'product' | 'image' | 'spec' | 'variant' | 'stockUnit',
        id: string,
    ) => {
        setDeletingType(type);
        setDeletingId(id);
    };

    return (
        <AppLayout>
            <Head title={`Product Detail - ${product.name}`} />

            <div className="container mx-auto space-y-8 px-6 py-10">
                {/* BREADCRUMB / BACK */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Link
                        href="/dashboard/ecommerce/products"
                        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Products
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/dashboard/ecommerce/products/${product.id}/edit`}
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <Pencil className="h-4 w-4" />
                                Edit Product
                            </Button>
                        </Link>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={() => triggerDelete('product', product.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* PRODUCT TITLE & HEADER */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            {product.name}
                        </h1>
                        <p className="text-muted-foreground">
                            ID: {product.id} • Slug: {product.slug}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {product.is_publish ? (
                            <Badge className="rounded-full bg-green-500 px-3 py-1 text-sm font-semibold hover:bg-green-600">
                                Published
                            </Badge>
                        ) : (
                            <Badge
                                variant="secondary"
                                className="rounded-full px-3 py-1 text-sm font-semibold"
                            >
                                Draft
                            </Badge>
                        )}
                        <Badge
                            variant="outline"
                            className="rounded-full px-3 py-1 text-sm font-semibold capitalize"
                        >
                            Condition: {product.condition.replace('_', ' ')}
                        </Badge>
                    </div>
                </div>

                <Separator />

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* LEFT SECTION (General info, specs, variants) */}
                    <div className="space-y-8 lg:col-span-2">
                        {/* GENERAL INFO */}
                        <Card className="overflow-hidden border shadow-sm">
                            <CardHeader className="bg-muted/50">
                                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                    <FileText className="h-5 w-5 text-primary" />
                                    General Information
                                </CardTitle>
                                <CardDescription>
                                    Key product details and features
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <span className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Category
                                        </span>
                                        <span className="mt-1 block text-sm font-medium">
                                            {product.category?.name || (
                                                <span className="text-muted-foreground italic">
                                                    No category
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Brand
                                        </span>
                                        <span className="mt-1 block text-sm font-medium">
                                            {product.brand?.name || (
                                                <span className="text-muted-foreground italic">
                                                    No brand
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Base Price
                                        </span>
                                        <span className="mt-1 block text-lg font-bold text-primary">
                                            ¥
                                            {Number(
                                                product.base_price,
                                            ).toLocaleString('ja-JP')}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Product Variant Status
                                        </span>
                                        <span className="mt-1 block text-sm font-medium">
                                            {product.has_variant ? (
                                                <Badge className="border-none bg-blue-100 text-blue-800 shadow-none hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/40">
                                                    Has Variants
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="text-muted-foreground"
                                                >
                                                    Standard (No Variants)
                                                </Badge>
                                            )}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Stock Unit Flow
                                        </span>
                                        <span className="mt-1 block text-sm font-medium">
                                            <Badge
                                                variant="outline"
                                                className="text-muted-foreground"
                                            >
                                                Variant → IMEI → Network
                                            </Badge>
                                        </span>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <span className="mb-2 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        Description
                                    </span>
                                    <div className="rounded-lg border bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                                        {product.description || (
                                            <span className="text-muted-foreground italic">
                                                No description provided.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* PRODUCT VARIANTS */}
                        <Card className="border shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between bg-muted/50 py-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                        <Boxes className="h-5 w-5 text-primary" />
                                        Product Variants
                                    </CardTitle>
                                    <CardDescription>
                                        Manage available stock, SKU, and prices
                                        for variations
                                    </CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    className="gap-1 shadow-xs"
                                    onClick={triggerCreateVariant}
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Variant
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                {!product.variants ||
                                product.variants.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                                        <Layers className="mb-2 h-8 w-8 text-muted-foreground/60" />
                                        <p className="font-medium text-muted-foreground">
                                            No variants added yet
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Create variations like different
                                            colors, sizes, or configurations.
                                        </p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/30">
                                                <TableHead className="px-6">
                                                    Name
                                                </TableHead>
                                                <TableHead className="px-6">
                                                    SKU
                                                </TableHead>
                                                <TableHead className="px-6">
                                                    Price
                                                </TableHead>
                                                <TableHead className="px-6">
                                                    Stock
                                                </TableHead>
                                                <TableHead className="px-6">
                                                    Stock Unit / Network
                                                </TableHead>
                                                <TableHead className="px-6">
                                                    Weight
                                                </TableHead>
                                                <TableHead className="px-6">
                                                    Status
                                                </TableHead>
                                                <TableHead className="w-[100px] px-6 text-right">
                                                    Actions
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {product.variants.map((v) => (
                                                <TableRow
                                                    key={v.id}
                                                    className="hover:bg-muted/50"
                                                >
                                                    <TableCell className="px-6 text-sm font-semibold">
                                                        <div className="flex items-center gap-3">
                                                            {v.image ? (
                                                                <img
                                                                    src={`/storage/${v.image}`}
                                                                    alt={v.name}
                                                                    className="h-12 w-12 rounded-md border object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted/50">
                                                                    <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
                                                                </div>
                                                            )}
                                                            <span>
                                                                {v.name}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 font-mono text-sm text-xs">
                                                        {v.sku}
                                                    </TableCell>
                                                    <TableCell className="px-6 text-sm font-medium text-primary">
                                                        ¥
                                                        {Number(
                                                            v.price,
                                                        ).toLocaleString(
                                                            'ja-JP',
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 text-sm">
                                                        {v.track_stock ? (
                                                            <span
                                                                className={
                                                                    (v.available_stock_units_count ??
                                                                        v.stock) >
                                                                    0
                                                                        ? 'font-semibold text-green-600'
                                                                        : 'font-semibold text-red-500'
                                                                }
                                                            >
                                                                {v.available_stock_units_count ??
                                                                    v.stock}{' '}
                                                                pcs
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">
                                                                Unlimited
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6">
                                                        <div className="space-y-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 gap-1"
                                                                onClick={() =>
                                                                    triggerCreateStockUnit(
                                                                        v,
                                                                    )
                                                                }
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                                Add IMEI
                                                            </Button>

                                                            {v.stock_units &&
                                                            v.stock_units
                                                                .length > 0 ? (
                                                                <div className="space-y-1">
                                                                    {v.stock_units.map(
                                                                        (
                                                                            stockUnit,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    stockUnit.id
                                                                                }
                                                                                className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/50 px-2 py-1 text-xs"
                                                                            >
                                                                                <div className="min-w-0">
                                                                                    <div className="truncate font-mono font-semibold">
                                                                                        {
                                                                                            stockUnit.imei_serial_number
                                                                                        }
                                                                                    </div>
                                                                                    <div className="text-muted-foreground">
                                                                                        {networkLabel(
                                                                                            stockUnit.network_compatibility,
                                                                                        )}{' '}
                                                                                        •{' '}
                                                                                        {
                                                                                            stockUnit.status
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex shrink-0 items-center gap-1">
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="h-6 w-6"
                                                                                        onClick={() =>
                                                                                            triggerEditStockUnit(
                                                                                                stockUnit,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <Pencil className="h-3 w-3" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                                        onClick={() =>
                                                                                            triggerDelete(
                                                                                                'stockUnit',
                                                                                                stockUnit.id,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <Trash2 className="h-3 w-3" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-muted-foreground">
                                                                    No IMEI
                                                                    units yet
                                                                </p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 text-sm">
                                                        {v.weight
                                                            ? `${Number(v.weight).toLocaleString('id-ID')} kg`
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell className="px-6">
                                                        {v.is_active ? (
                                                            <Badge className="border-none bg-green-100 px-2 py-0.5 text-[10px] text-green-800 shadow-none hover:bg-green-100 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-950/40">
                                                                Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="secondary"
                                                                className="px-2 py-0.5 text-[10px]"
                                                            >
                                                                Inactive
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="flex items-center justify-end gap-1 px-6 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-primary hover:bg-primary/10"
                                                            onClick={() =>
                                                                triggerEditVariant(
                                                                    v,
                                                                )
                                                            }
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={() =>
                                                                triggerDelete(
                                                                    'variant',
                                                                    v.id,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>

                        {/* SPECIFICATIONS */}
                        <Card className="border shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between bg-muted/50 py-4">
                                <div>
                                    <CardTitle className="text-lg font-bold">
                                        Specifications
                                    </CardTitle>
                                    <CardDescription>
                                        Technical specifications of the product
                                    </CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    className="gap-1 shadow-xs"
                                    onClick={() => setIsSpecModalOpen(true)}
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Spec
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                {product.specifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                                        <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground/60" />
                                        <p className="font-medium text-muted-foreground">
                                            No specifications added yet
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Add technical details like screen
                                            size, processor, ram, etc.
                                        </p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/30">
                                                <TableHead className="w-1/3 px-6">
                                                    Specification Name
                                                </TableHead>
                                                <TableHead className="px-6">
                                                    Value
                                                </TableHead>
                                                <TableHead className="w-[80px] px-6 text-right">
                                                    Actions
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {product.specifications.map(
                                                (spec) => (
                                                    <TableRow
                                                        key={spec.id}
                                                        className="hover:bg-muted/50"
                                                    >
                                                        <TableCell className="px-6 text-sm font-semibold">
                                                            {spec.spec_name}
                                                        </TableCell>
                                                        <TableCell className="px-6 text-sm">
                                                            {spec.spec_value}
                                                        </TableCell>
                                                        <TableCell className="px-6 text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                onClick={() =>
                                                                    triggerDelete(
                                                                        'spec',
                                                                        spec.id,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>

                        {/* SEO META */}
                        {(product.meta_title || product.meta_description) && (
                            <Card className="border shadow-sm">
                                <CardHeader className="bg-muted/50">
                                    <CardTitle className="text-md flex items-center gap-2 font-bold">
                                        <Eye className="h-4 w-4 text-primary" />
                                        SEO Metadata Preview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-6">
                                    {product.meta_title && (
                                        <div>
                                            <span className="block text-xs font-semibold text-muted-foreground">
                                                Meta Title
                                            </span>
                                            <span className="mt-1 block text-sm font-semibold text-blue-800 dark:text-blue-300">
                                                {product.meta_title}
                                            </span>
                                        </div>
                                    )}
                                    {product.meta_description && (
                                        <div>
                                            <span className="block text-xs font-semibold text-muted-foreground">
                                                Meta Description
                                            </span>
                                            <span className="mt-1 block text-sm text-muted-foreground">
                                                {product.meta_description}
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* RIGHT SECTION (Thumbnail, Images) */}
                    <div className="space-y-8 lg:col-span-1">
                        {/* THUMBNAIL */}
                        <Card className="overflow-hidden border shadow-sm">
                            <CardHeader className="bg-muted/50">
                                <CardTitle className="text-md font-bold">
                                    Thumbnail Cover
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center p-6">
                                {product.thumbnail ? (
                                    <div className="group relative aspect-square w-full max-w-[200px] overflow-hidden rounded-lg border bg-muted/50 p-2">
                                        <img
                                            src={`/storage/${product.thumbnail}`}
                                            alt={product.name}
                                            className="h-full w-full object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex aspect-square w-full max-w-[200px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted p-4 text-muted-foreground">
                                        <ImageIcon className="mb-2 h-10 w-10 opacity-40" />
                                        <span className="text-center text-xs">
                                            No cover thumbnail set
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* PRODUCT GALLERY */}
                        <Card className="border shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between bg-muted/50 py-4">
                                <div>
                                    <CardTitle className="text-md font-bold">
                                        Image Gallery
                                    </CardTitle>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-1"
                                    onClick={() => setIsImageModalOpen(true)}
                                >
                                    <Plus className="h-3 w-3" />
                                    Add Image
                                </Button>
                            </CardHeader>
                            <CardContent className="p-6">
                                {product.images.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                                        <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground/60" />
                                        <p className="text-xs font-semibold text-muted-foreground">
                                            Gallery is empty
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                                            Upload additional pictures for this
                                            product
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {product.images.map((img) => (
                                            <div
                                                key={img.id}
                                                className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-muted/50 p-2"
                                            >
                                                <img
                                                    src={`/storage/${img.image}`}
                                                    alt="Product gallery image"
                                                    className="max-h-full max-w-full object-contain"
                                                />

                                                {/* PRIMARY BADGE */}
                                                {img.is_primary && (
                                                    <span
                                                        className="absolute top-2 left-2 rounded-full bg-yellow-400 p-1 text-yellow-950 shadow-xs"
                                                        title="Primary Image"
                                                    >
                                                        <Star className="h-3 w-3 fill-yellow-950" />
                                                    </span>
                                                )}

                                                {/* HOVER ACTIONS */}
                                                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full"
                                                        onClick={() =>
                                                            triggerDelete(
                                                                'image',
                                                                img.id,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {/* SORT ORDER INDICATOR */}
                                                <span className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white">
                                                    Order: {img.sort_order}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* DIALOG: ADD SPECIFICATION */}
            <Dialog open={isSpecModalOpen} onOpenChange={setIsSpecModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Product Specification</DialogTitle>
                        <DialogDescription>
                            Create a new technical specification row for this
                            product.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={specForm.handleSubmit(onAddSpecification)}
                        className="space-y-4 py-2"
                    >
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="spec_name">
                                Specification Name
                            </Label>
                            <Input
                                id="spec_name"
                                placeholder="e.g., RAM, Screen Size, Battery Capacity"
                                {...specForm.register('spec_name')}
                            />
                            {specForm.formState.errors.spec_name && (
                                <p className="text-xs text-destructive">
                                    {
                                        specForm.formState.errors.spec_name
                                            .message
                                    }
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="spec_value">
                                Specification Value
                            </Label>
                            <Input
                                id="spec_value"
                                placeholder="e.g., 8 GB, 6.7 inches, 5000 mAh"
                                {...specForm.register('spec_value')}
                            />
                            {specForm.formState.errors.spec_value && (
                                <p className="text-xs text-destructive">
                                    {
                                        specForm.formState.errors.spec_value
                                            .message
                                    }
                                </p>
                            )}
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsSpecModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submittingSpec}>
                                {submittingSpec
                                    ? 'Adding...'
                                    : 'Add Specification'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DIALOG: ADD IMAGE */}
            <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Product Image</DialogTitle>
                        <DialogDescription>
                            Upload an additional image for this product's
                            gallery.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={imageForm.handleSubmit(onAddImage)}
                        className="space-y-4 py-2"
                    >
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="image-file">Image File</Label>
                            <Input
                                id="image-file"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        imageForm.setValue(
                                            'image',
                                            e.target.files[0],
                                        );
                                    }
                                }}
                            />
                            {imageForm.formState.errors.image && (
                                <p className="text-xs text-destructive">
                                    {
                                        imageForm.formState.errors.image
                                            .message as string
                                    }
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="sort_order">Sort Order</Label>
                            <Input
                                id="sort_order"
                                type="number"
                                min="0"
                                {...imageForm.register('sort_order')}
                            />
                            {imageForm.formState.errors.sort_order && (
                                <p className="text-xs text-destructive">
                                    {
                                        imageForm.formState.errors.sort_order
                                            .message
                                    }
                                </p>
                            )}
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="modal_is_primary"
                                checked={imageForm.watch('is_primary')}
                                onCheckedChange={(checked) =>
                                    imageForm.setValue(
                                        'is_primary',
                                        checked as boolean,
                                    )
                                }
                            />
                            <Label htmlFor="modal_is_primary">
                                Set as primary cover image
                            </Label>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsImageModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submittingImage}>
                                {submittingImage
                                    ? 'Uploading...'
                                    : 'Upload Image'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DIALOG: ADD/EDIT PRODUCT VARIANT */}
            <Dialog
                open={isVariantModalOpen}
                onOpenChange={setIsVariantModalOpen}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingVariant
                                ? 'Edit Product Variant'
                                : 'Add Product Variant'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingVariant
                                ? 'Update the details for this product variation.'
                                : 'Create a new variant option for this product.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={variantForm.handleSubmit(onSaveVariant)}
                        className="space-y-6 py-2"
                    >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* NAME */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="variant_name">
                                    Variant Name
                                </Label>
                                <Input
                                    id="variant_name"
                                    placeholder="e.g., Red - 128GB, Medium"
                                    {...variantForm.register('name')}
                                />
                                {variantForm.formState.errors.name && (
                                    <p className="text-xs text-destructive">
                                        {
                                            variantForm.formState.errors.name
                                                .message
                                        }
                                    </p>
                                )}
                            </div>

                            {/* SKU */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="variant_sku">SKU</Label>
                                <Input
                                    id="variant_sku"
                                    placeholder="e.g., IP15-RED-128"
                                    {...variantForm.register('sku')}
                                />
                                {variantForm.formState.errors.sku && (
                                    <p className="text-xs text-destructive">
                                        {
                                            variantForm.formState.errors.sku
                                                .message
                                        }
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5 md:col-span-2">
                                <Label htmlFor="variant_image">
                                    Variant Image
                                </Label>
                                {editingVariant?.image && (
                                    <img
                                        src={`/storage/${editingVariant.image}`}
                                        alt={editingVariant.name}
                                        className="h-24 w-24 rounded-md border object-cover"
                                    />
                                )}
                                <Input
                                    id="variant_image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        variantForm.setValue(
                                            'image',
                                            e.target.files?.[0],
                                            { shouldValidate: true },
                                        )
                                    }
                                />
                                {variantForm.formState.errors.image && (
                                    <p className="text-xs text-destructive">
                                        {
                                            variantForm.formState.errors.image
                                                .message as string
                                        }
                                    </p>
                                )}
                            </div>

                            {/* PRICE */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="variant_price">Price (¥)</Label>
                                <Input
                                    id="variant_price"
                                    type="number"
                                    min="0"
                                    placeholder="e.g., 98000"
                                    {...variantForm.register('price')}
                                />
                                {variantForm.formState.errors.price && (
                                    <p className="text-xs text-destructive">
                                        {
                                            variantForm.formState.errors.price
                                                .message
                                        }
                                    </p>
                                )}
                            </div>

                            {/* COST PRICE */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="variant_cost_price">
                                    Cost Price (¥) (Optional)
                                </Label>
                                <Input
                                    id="variant_cost_price"
                                    type="number"
                                    min="0"
                                    placeholder="e.g., 80000"
                                    {...variantForm.register('cost_price')}
                                />
                                {variantForm.formState.errors.cost_price && (
                                    <p className="text-xs text-destructive">
                                        {
                                            variantForm.formState.errors
                                                .cost_price.message
                                        }
                                    </p>
                                )}
                            </div>

                            {/* MIN STOCK ALERT */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="variant_min_stock_alert">
                                    Min Stock Alert (Optional)
                                </Label>
                                <Input
                                    id="variant_min_stock_alert"
                                    type="number"
                                    min="0"
                                    disabled={!variantForm.watch('track_stock')}
                                    {...variantForm.register('min_stock_alert')}
                                />
                                {variantForm.formState.errors
                                    .min_stock_alert && (
                                    <p className="text-xs text-destructive">
                                        {
                                            variantForm.formState.errors
                                                .min_stock_alert.message
                                        }
                                    </p>
                                )}
                            </div>

                            {/* WEIGHT */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="variant_weight">
                                    Weight (kg) (Optional)
                                </Label>
                                <Input
                                    id="variant_weight"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="e.g., 0.2"
                                    {...variantForm.register('weight')}
                                />
                                {variantForm.formState.errors.weight && (
                                    <p className="text-xs text-destructive">
                                        {
                                            variantForm.formState.errors.weight
                                                .message
                                        }
                                    </p>
                                )}
                            </div>
                        </div>

                        <Separator />

                        <div className="flex flex-wrap gap-6">
                            {/* TRACK STOCK */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="variant_track_stock"
                                    checked={variantForm.watch('track_stock')}
                                    onCheckedChange={(checked) =>
                                        variantForm.setValue(
                                            'track_stock',
                                            checked as boolean,
                                        )
                                    }
                                />
                                <Label
                                    htmlFor="variant_track_stock"
                                    className="cursor-pointer"
                                >
                                    Track inventory stock for this variant
                                </Label>
                            </div>

                            {/* IS ACTIVE */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="variant_is_active"
                                    checked={variantForm.watch('is_active')}
                                    onCheckedChange={(checked) =>
                                        variantForm.setValue(
                                            'is_active',
                                            checked as boolean,
                                        )
                                    }
                                />
                                <Label
                                    htmlFor="variant_is_active"
                                    className="cursor-pointer"
                                >
                                    Set variant status as Active
                                </Label>
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsVariantModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submittingVariant}>
                                {submittingVariant
                                    ? 'Saving...'
                                    : editingVariant
                                      ? 'Update Variant'
                                      : 'Create Variant'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DIALOG: ADD/EDIT STOCK UNIT */}
            <Dialog
                open={isStockUnitModalOpen}
                onOpenChange={setIsStockUnitModalOpen}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingStockUnit
                                ? 'Edit Stock Unit / IMEI'
                                : 'Add Stock Unit / IMEI'}
                        </DialogTitle>
                        <DialogDescription>
                            Register the device identifier first, then assign
                            the network for this exact unit.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={stockUnitForm.handleSubmit(onSaveStockUnit)}
                        className="space-y-5 py-2"
                    >
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="stock_unit_variant">
                                Product Variant
                            </Label>
                            <select
                                id="stock_unit_variant"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={stockUnitForm.watch(
                                    'product_variant_id',
                                )}
                                onChange={(e) =>
                                    stockUnitForm.setValue(
                                        'product_variant_id',
                                        e.target.value,
                                        {
                                            shouldValidate: true,
                                        },
                                    )
                                }
                            >
                                <option value="">-- Select Variant --</option>
                                {product.variants.map((variant) => (
                                    <option key={variant.id} value={variant.id}>
                                        {variant.name} ({variant.sku})
                                    </option>
                                ))}
                            </select>
                            {stockUnitForm.formState.errors
                                .product_variant_id && (
                                <p className="text-xs text-destructive">
                                    {
                                        stockUnitForm.formState.errors
                                            .product_variant_id.message
                                    }
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="imei_serial_number">
                                    IMEI / Serial Number
                                </Label>
                                <Input
                                    id="imei_serial_number"
                                    placeholder="e.g., 351234567890123"
                                    {...stockUnitForm.register(
                                        'imei_serial_number',
                                    )}
                                />
                                {stockUnitForm.formState.errors
                                    .imei_serial_number && (
                                    <p className="text-xs text-destructive">
                                        {
                                            stockUnitForm.formState.errors
                                                .imei_serial_number.message
                                        }
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="stock_unit_status">
                                    Status
                                </Label>
                                <select
                                    id="stock_unit_status"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={stockUnitForm.watch('status')}
                                    onChange={(e) =>
                                        stockUnitForm.setValue(
                                            'status',
                                            e.target
                                                .value as StockUnitFormData['status'],
                                            { shouldValidate: true },
                                        )
                                    }
                                >
                                    <option value="available">Available</option>
                                    <option value="reserved">Reserved</option>
                                    <option value="sold">Sold</option>
                                    <option value="damaged">Damaged</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <Checkbox
                                    checked={stockUnitHasNetwork}
                                    onCheckedChange={(checked) => {
                                        const enabled = checked === true;

                                        setStockUnitHasNetwork(enabled);
                                        stockUnitForm.setValue(
                                            'network_compatibility',
                                            enabled
                                                ? stockUnitForm.watch(
                                                      'network_compatibility',
                                                  ) || 'sim_free'
                                                : null,
                                            { shouldValidate: true },
                                        );
                                    }}
                                />
                                Ada network
                            </label>

                            {stockUnitHasNetwork && (
                                <div className="space-y-2">
                                    <Label>Network</Label>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                        {networkOptions.map((option) => {
                                            const selected =
                                                stockUnitForm.watch(
                                                    'network_compatibility',
                                                ) === option.value;

                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() =>
                                                        stockUnitForm.setValue(
                                                            'network_compatibility',
                                                            option.value,
                                                            {
                                                                shouldValidate: true,
                                                            },
                                                        )
                                                    }
                                                    className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                                                        selected
                                                            ? option.value ===
                                                              'sim_free'
                                                                ? 'border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                : 'border-red-500 bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                                                            : 'border-border bg-card text-muted-foreground hover:border-border'
                                                    }`}
                                                >
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {stockUnitForm.formState.errors
                                .network_compatibility && (
                                <p className="text-xs text-destructive">
                                    {
                                        stockUnitForm.formState.errors
                                            .network_compatibility.message
                                    }
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="stock_unit_note">Note</Label>
                            <Textarea
                                id="stock_unit_note"
                                rows={3}
                                placeholder="Optional internal note..."
                                {...stockUnitForm.register('note')}
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsStockUnitModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submittingStockUnit}
                            >
                                {submittingStockUnit
                                    ? 'Saving...'
                                    : editingStockUnit
                                      ? 'Update Stock Unit'
                                      : 'Add Stock Unit'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ALERT DIALOG: DELETE CONFIRMATION */}
            <AlertDialog
                open={!!deletingId && !!deletingType}
                onOpenChange={() => {
                    setDeletingId(null);
                    setDeletingType(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the selected {deletingType} from the
                            database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
