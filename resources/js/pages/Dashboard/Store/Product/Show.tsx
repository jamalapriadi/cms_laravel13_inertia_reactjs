import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Image as ImageIcon,
    Images,
    Layers,
    Package,
    Pencil,
    Plus,
    Settings2,
    Trash2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import Textarea from '@/components/ui/textarea';
import AppLayout from '@/layouts/master-data-layout';
import { mediaUrl } from '@/lib/media';
import { formatRupiah } from '@/lib/utils';

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

interface ProductVariantOption {
    id: string;
    value: string;
}

interface ProductVariant {
    id: string;
    name: string;
    options?: ProductVariantOption[];
}

interface VariantItem {
    id: string;
    sku: string;
    name: string;
    image?: string | null;
    buying_price: string | number;
    selling_price: string | number;
    stock: number;
    available_stock_units_count?: number;
    is_active: boolean;
    options?: ProductVariantOption[];
}

interface StockUnit {
    id: string;
    imei_serial_number: string;
    network_compatibility: string | null;
    status: 'available' | 'reserved' | 'sold' | 'damaged';
    note?: string | null;
}

interface Product {
    id: string;
    category_id: string;
    brand_id?: string | null;
    unit_id?: string | null;
    name: string;
    slug: string;
    thumbnail?: string | null;
    description?: string | null;
    condition: 'new' | 'like_new' | 'second';
    base_price: string | number;
    has_variant: boolean;
    sku?: string | null;
    is_publish: boolean;
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
    variant_items: VariantItem[];
    stock_units?: StockUnit[];
    stock_units_count?: number;
    available_stock_units_count?: number;
}

interface Props {
    product: Product;
}

const money = (value: string | number | null | undefined) =>
    formatRupiah(value);

export default function Show({ product }: Props) {
    const mediaUrlBase = (usePage().props as { mediaUrlBase?: string }).mediaUrlBase;
    const [editingSpecificationId, setEditingSpecificationId] = useState<
        string | null
    >(null);
    const [deletingSpecificationId, setDeletingSpecificationId] = useState<
        string | null
    >(null);
    const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const {
        data: specificationData,
        setData: setSpecificationData,
        post: postSpecification,
        processing: addingSpecification,
        errors: specificationErrors,
        reset: resetSpecification,
    } = useForm({
        product_id: product.id,
        spec_name: '',
        spec_value: '',
    });

    const {
        data: specificationEditData,
        setData: setSpecificationEditData,
        put: updateSpecification,
        processing: updatingSpecification,
        errors: specificationEditErrors,
    } = useForm({
        product_id: product.id,
        spec_name: '',
        spec_value: '',
    });

    const {
        data: imageData,
        setData: setImageData,
        post: postImages,
        processing: uploadingImages,
        errors: imageErrors,
        reset: resetImageForm,
    } = useForm({
        product_id: product.id,
        image: '',
        images: [] as File[],
        is_primary: false,
        sort_order: 0,
    });

    const submitSpecification = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        postSpecification('/my-admin/dashboard/ecommerce/product-specifications', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Specification added successfully.');
                resetSpecification('spec_name', 'spec_value');
            },
        });
    };

    const startEditSpecification = (specification: ProductSpecification) => {
        setEditingSpecificationId(specification.id);
        setSpecificationEditData({
            product_id: product.id,
            spec_name: specification.spec_name,
            spec_value: specification.spec_value ?? '',
        });
    };

    const submitSpecificationUpdate = (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        if (!editingSpecificationId) {
            return;
        }

        updateSpecification(
            `/my-admin/dashboard/ecommerce/product-specifications/${editingSpecificationId}`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Specification updated successfully.');
                    setEditingSpecificationId(null);
                },
            },
        );
    };

    const deleteSpecification = () => {
        if (!deletingSpecificationId) {
            return;
        }

        router.delete(
            `/my-admin/dashboard/ecommerce/product-specifications/${deletingSpecificationId}`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Specification deleted successfully.');
                },
                onFinish: () => setDeletingSpecificationId(null),
            },
        );
    };

    const submitImages = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        postImages('/my-admin/dashboard/ecommerce/product-images', {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success('Product images uploaded successfully.');
                resetImageForm('images');

                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        });
    };

    const deleteImage = () => {
        if (!deletingImageId) {
            return;
        }

        router.delete(`/my-admin/dashboard/ecommerce/product-images/${deletingImageId}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Product image deleted successfully.');
            },
            onFinish: () => setDeletingImageId(null),
        });
    };

    const specificationCount = product.specifications.length;
    const imageCount = product.images.length;
    const availableStock = product.available_stock_units_count ?? 0;
    const totalStock = product.stock_units_count ?? 0;

    return (
        <AppLayout>
            <Head title={product.name} />

            <div className="mx-auto max-w-[1480px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="rounded-2xl border bg-gradient-to-r from-background via-background to-muted/40 p-4 shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                            <Link href="/my-admin/dashboard/ecommerce/products">
                                <Button size="icon" variant="secondary">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div className="min-w-0">
                                <h1 className="truncate text-xl font-bold sm:text-2xl">
                                    {product.name}
                                </h1>
                                <p className="text-sm text-muted-foreground sm:text-base">
                                    {product.category?.name ?? '-'} ·{' '}
                                    {product.brand?.name ?? 'No brand'}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <Badge
                                        variant={
                                            product.is_publish
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {product.is_publish
                                            ? 'Published'
                                            : 'Draft'}
                                    </Badge>
                                    <Badge variant="outline">
                                        {specificationCount} Specs
                                    </Badge>
                                    <Badge variant="outline">
                                        {imageCount} Images
                                    </Badge>
                                    <Badge variant="outline">
                                        Stock {availableStock}/{totalStock}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <Link
                            href={`/my-admin/dashboard/ecommerce/products/${product.id}/edit`}
                            className="w-full sm:w-auto"
                        >
                            <Button variant="secondary" className="w-full sm:w-auto">
                                Edit Product
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
                    <Card className="sticky top-24 shadow-sm transition-shadow hover:shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ImageIcon className="h-4 w-4" />
                                Product Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {product.thumbnail ? (
                                <img
                                    src={mediaUrl(product.thumbnail, mediaUrlBase) ?? ''}
                                    alt={product.name}
                                    className="aspect-square w-full rounded-lg border object-cover transition-transform duration-300 hover:scale-[1.02]"
                                />
                            ) : (
                                <div className="flex aspect-square w-full items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                                    No Image
                                </div>
                            )}
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
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant={product.is_publish ? 'default' : 'secondary'}>
                                    {product.is_publish ? 'Published' : 'Draft'}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 border-t pt-4 text-xs text-muted-foreground">
                                <div className="rounded-md bg-muted/50 p-2">
                                    <p className="font-medium text-foreground">
                                        {specificationCount}
                                    </p>
                                    <p>Specifications</p>
                                </div>
                                <div className="rounded-md bg-muted/50 p-2">
                                    <p className="font-medium text-foreground">
                                        {imageCount}
                                    </p>
                                    <p>Gallery Images</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="shadow-sm transition-shadow hover:shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between gap-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Settings2 className="h-4 w-4" />
                                    Product Specifications
                                </CardTitle>
                                <Link
                                    href={`/my-admin/dashboard/ecommerce/product-specifications?product_id=${product.id}`}
                                >
                                    <Button size="sm" variant="secondary">
                                        Manage All
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <form
                                    onSubmit={submitSpecification}
                                    className="rounded-lg border bg-muted/20 p-4"
                                >
                                    <p className="mb-4 text-sm font-medium">
                                        Add Specification
                                    </p>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="spec_name">
                                                Name / Key
                                            </Label>
                                            <Input
                                                id="spec_name"
                                                value={specificationData.spec_name}
                                                onChange={(event) =>
                                                    setSpecificationData(
                                                        'spec_name',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="e.g., Color"
                                            />
                                            {specificationErrors.spec_name && (
                                                <p className="text-xs text-destructive">
                                                    {
                                                        specificationErrors.spec_name
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="spec_value">
                                                Value
                                            </Label>
                                            <Textarea
                                                id="spec_value"
                                                rows={3}
                                                value={specificationData.spec_value}
                                                onChange={(event) =>
                                                    setSpecificationData(
                                                        'spec_value',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="e.g., Red Blue"
                                            />
                                            {specificationErrors.spec_value && (
                                                <p className="text-xs text-destructive">
                                                    {
                                                        specificationErrors.spec_value
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            type="submit"
                                            size="sm"
                                            disabled={addingSpecification}
                                        >
                                            <Plus className="h-4 w-4" />
                                            {addingSpecification
                                                ? 'Saving...'
                                                : 'Add Specification'}
                                        </Button>
                                    </div>
                                </form>

                                <div className="overflow-x-auto rounded-lg border bg-background">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name / Key</TableHead>
                                                <TableHead>Value</TableHead>
                                                <TableHead className="w-28" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {product.specifications.map(
                                                (specification) =>
                                                    editingSpecificationId ===
                                                    specification.id ? (
                                                        <TableRow
                                                            key={
                                                                specification.id
                                                            }
                                                            className="hover:bg-muted/30"
                                                        >
                                                            <TableCell>
                                                                <form
                                                                    id="edit-specification-form"
                                                                    onSubmit={
                                                                        submitSpecificationUpdate
                                                                    }
                                                                    className="space-y-2"
                                                                >
                                                                    <Input
                                                                        value={
                                                                            specificationEditData.spec_name
                                                                        }
                                                                        onChange={(
                                                                            event,
                                                                        ) =>
                                                                            setSpecificationEditData(
                                                                                'spec_name',
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                    />
                                                                    {specificationEditErrors.spec_name && (
                                                                        <p className="text-xs text-destructive">
                                                                            {
                                                                                specificationEditErrors.spec_name
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </form>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Textarea
                                                                    form="edit-specification-form"
                                                                    rows={2}
                                                                    value={
                                                                        specificationEditData.spec_value
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        setSpecificationEditData(
                                                                            'spec_value',
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                                {specificationEditErrors.spec_value && (
                                                                    <p className="mt-2 text-xs text-destructive">
                                                                        {
                                                                            specificationEditErrors.spec_value
                                                                        }
                                                                    </p>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="icon"
                                                                        form="edit-specification-form"
                                                                        type="submit"
                                                                        disabled={
                                                                            updatingSpecification
                                                                        }
                                                                    >
                                                                        <span className="sr-only">
                                                                            Save
                                                                        </span>
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        size="icon"
                                                                        variant="secondary"
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setEditingSpecificationId(
                                                                                null,
                                                                            )
                                                                        }
                                                                    >
                                                                        <span className="sr-only">
                                                                            Cancel
                                                                        </span>
                                                                        <ArrowLeft className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        <TableRow
                                                            key={
                                                                specification.id
                                                            }
                                                            className="hover:bg-muted/30"
                                                        >
                                                            <TableCell className="font-medium">
                                                                {
                                                                    specification.spec_name
                                                                }
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {
                                                                    specification.spec_value ||
                                                                    '-'
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="icon"
                                                                        variant="secondary"
                                                                        onClick={() =>
                                                                            startEditSpecification(
                                                                                specification,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        size="icon"
                                                                        variant="destructive"
                                                                        onClick={() =>
                                                                            setDeletingSpecificationId(
                                                                                specification.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ),
                                            )}
                                            {product.specifications.length ===
                                                0 && (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={3}
                                                        className="py-8 text-center text-muted-foreground"
                                                    >
                                                        No specification yet for
                                                        this product.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm transition-shadow hover:shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between gap-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Images className="h-4 w-4" />
                                    Product Images
                                </CardTitle>
                                <Link
                                    href={`/my-admin/dashboard/ecommerce/product-images?product_id=${product.id}`}
                                >
                                    <Button size="sm" variant="secondary">
                                        Manage All
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <form
                                    onSubmit={submitImages}
                                    className="rounded-lg border bg-muted/20 p-4"
                                >
                                    <p className="mb-4 text-sm font-medium">
                                        Upload Product Images
                                    </p>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="images">
                                                Image Files (Multiple)
                                            </Label>
                                            <Input
                                                id="images"
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={(event) => {
                                                    const files = Array.from(
                                                        event.target.files ??
                                                            [],
                                                    );

                                                    setImageData('images', files);
                                                }}
                                            />
                                            {imageErrors.image && (
                                                <p className="text-xs text-destructive">
                                                    {imageErrors.image}
                                                </p>
                                            )}
                                            {imageErrors.images && (
                                                <p className="text-xs text-destructive">
                                                    {imageErrors.images}
                                                </p>
                                            )}
                                            {imageErrors['images.0'] && (
                                                <p className="text-xs text-destructive">
                                                    {imageErrors['images.0']}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="sort_order">
                                                Start Sort Order
                                            </Label>
                                            <Input
                                                id="sort_order"
                                                type="number"
                                                min={0}
                                                value={imageData.sort_order}
                                                onChange={(event) =>
                                                    setImageData(
                                                        'sort_order',
                                                        Number(
                                                            event.target.value,
                                                        ) || 0,
                                                    )
                                                }
                                            />
                                            {imageErrors.sort_order && (
                                                <p className="text-xs text-destructive">
                                                    {imageErrors.sort_order}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-2 pt-8">
                                            <Checkbox
                                                id="is_primary"
                                                checked={imageData.is_primary}
                                                onCheckedChange={(checked) =>
                                                    setImageData(
                                                        'is_primary',
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            <Label htmlFor="is_primary">
                                                Set first uploaded image as
                                                primary
                                            </Label>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            type="submit"
                                            size="sm"
                                            disabled={uploadingImages}
                                        >
                                            <Plus className="h-4 w-4" />
                                            {uploadingImages
                                                ? 'Uploading...'
                                                : 'Upload Images'}
                                        </Button>
                                    </div>
                                </form>

                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {product.images.map((image) => (
                                        <div
                                            key={image.id}
                                            className="rounded-lg border p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm"
                                        >
                                            <img
                                                src={mediaUrl(image.image, mediaUrlBase) ?? ''}
                                                alt={product.name}
                                                className="h-40 w-full rounded-md border bg-muted object-cover"
                                            />
                                            <div className="mt-3 flex items-center justify-between gap-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge
                                                        variant={
                                                            image.is_primary
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {image.is_primary
                                                            ? 'Primary'
                                                            : 'Secondary'}
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        Sort: {image.sort_order}
                                                    </Badge>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        setDeletingImageId(
                                                            image.id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {product.images.length === 0 && (
                                    <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                                        No product images yet. Upload multiple
                                        images from the form above.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {product.has_variant ? (
                            <>
                                <Card className="shadow-sm transition-shadow hover:shadow-md">
                                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Layers className="h-4 w-4" />
                                            Product Variants
                                        </CardTitle>
                                        <Link
                                            href={`/my-admin/dashboard/ecommerce/product-variants/create?product_id=${product.id}`}
                                        >
                                            <Button size="sm">
                                                <Plus className="h-4 w-4" />
                                                Add Variant
                                            </Button>
                                        </Link>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {product.variants.map((variant) => (
                                                <div
                                                    key={variant.id}
                                                    className="rounded-lg border bg-background p-4"
                                                >
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <p className="font-medium">
                                                            {variant.name}
                                                        </p>
                                                        <Link
                                                            href={`/my-admin/dashboard/ecommerce/product-variants/${variant.id}/edit`}
                                                        >
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                            >
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {(
                                                            variant.options ??
                                                            []
                                                        ).map((option) => (
                                                            <Badge
                                                                key={option.id}
                                                                variant="secondary"
                                                            >
                                                                {option.value}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            {product.variants.length === 0 && (
                                                <p className="text-sm text-muted-foreground">
                                                    Belum ada variant untuk
                                                    produk ini.
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm transition-shadow hover:shadow-md">
                                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Package className="h-4 w-4" />
                                            Variant Items
                                        </CardTitle>
                                        <Link
                                            href={`/my-admin/dashboard/ecommerce/variant-items/create?product_id=${product.id}`}
                                        >
                                            <Button size="sm">
                                                <Plus className="h-4 w-4" />
                                                Generate Items
                                            </Button>
                                        </Link>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto rounded-lg border bg-background">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Variant
                                                        </TableHead>
                                                        <TableHead>
                                                            SKU
                                                        </TableHead>
                                                        <TableHead>
                                                            Buying
                                                        </TableHead>
                                                        <TableHead>
                                                            Selling
                                                        </TableHead>
                                                        <TableHead>
                                                            Stock
                                                        </TableHead>
                                                        <TableHead>
                                                            Status
                                                        </TableHead>
                                                        <TableHead />
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {product.variant_items.map(
                                                        (item) => (
                                                            <TableRow
                                                                key={item.id}
                                                                className="hover:bg-muted/30"
                                                            >
                                                                <TableCell>
                                                                    <div>
                                                                        <p className="font-medium">
                                                                            {
                                                                                item.name
                                                                            }
                                                                        </p>
                                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                                            {(
                                                                                item.options ??
                                                                                []
                                                                            ).map(
                                                                                (
                                                                                    option,
                                                                                ) => (
                                                                                    <Badge
                                                                                        key={
                                                                                            option.id
                                                                                        }
                                                                                        variant="secondary"
                                                                                    >
                                                                                        {
                                                                                            option.value
                                                                                        }
                                                                                    </Badge>
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {item.sku}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {money(
                                                                        item.buying_price,
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {money(
                                                                        item.selling_price,
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {item.available_stock_units_count ??
                                                                        item.stock}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge
                                                                        variant={
                                                                            item.is_active
                                                                                ? 'default'
                                                                                : 'destructive'
                                                                        }
                                                                    >
                                                                        {item.is_active
                                                                            ? 'Active'
                                                                            : 'Inactive'}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Link
                                                                        href={`/my-admin/dashboard/ecommerce/variant-items/${item.id}/edit`}
                                                                    >
                                                                        <Button
                                                                            size="sm"
                                                                            variant="secondary"
                                                                        >
                                                                            Edit
                                                                        </Button>
                                                                    </Link>
                                                                </TableCell>
                                                            </TableRow>
                                                        ),
                                                    )}
                                                    {product.variant_items
                                                        .length === 0 && (
                                                        <TableRow>
                                                            <TableCell
                                                                colSpan={7}
                                                                className="py-8 text-center text-muted-foreground"
                                                            >
                                                                Belum ada SKU
                                                                combination.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        ) : (
                            <Card className="shadow-sm transition-shadow hover:shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Package className="h-4 w-4" />
                                            Stock Units
                                        </CardTitle>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            Total Stock:{' '}
                                            {product.available_stock_units_count ??
                                                0}{' '}
                                            Available /{' '}
                                            {product.stock_units_count ?? 0}{' '}
                                            Total
                                        </p>
                                    </div>
                                    <Link
                                        href={`/my-admin/dashboard/ecommerce/product-stock-units/create?product_id=${product.id}`}
                                    >
                                        <Button size="sm">
                                            <Plus className="h-4 w-4" />
                                            Add Stock Unit
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto rounded-lg border bg-background">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        Serial Number
                                                    </TableHead>
                                                    <TableHead>
                                                        Network
                                                    </TableHead>
                                                    <TableHead>
                                                        Status
                                                    </TableHead>
                                                    <TableHead>Note</TableHead>
                                                    <TableHead className="w-24" />
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(
                                                    product.stock_units ?? []
                                                ).map((unit) => (
                                                    <TableRow key={unit.id} className="hover:bg-muted/30">
                                                        <TableCell className="font-mono font-medium">
                                                            {
                                                                unit.imei_serial_number
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {unit.network_compatibility ? (
                                                                <Badge variant="outline">
                                                                    {
                                                                        unit.network_compatibility
                                                                    }
                                                                </Badge>
                                                            ) : (
                                                                '-'
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={
                                                                    unit.status ===
                                                                    'available'
                                                                        ? 'default'
                                                                        : 'secondary'
                                                                }
                                                            >
                                                                {unit.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                                                            {unit.note || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Link
                                                                href={`/my-admin/dashboard/ecommerce/product-stock-units/${unit.id}/edit`}
                                                            >
                                                                <Button
                                                                    size="sm"
                                                                    variant="secondary"
                                                                >
                                                                    Edit
                                                                </Button>
                                                            </Link>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {(product.stock_units ?? [])
                                                    .length === 0 && (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={5}
                                                            className="py-8 text-center text-muted-foreground"
                                                        >
                                                            Belum ada stok unit
                                                            terdaftar untuk
                                                            produk ini.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            <AlertDialog
                open={!!deletingSpecificationId}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingSpecificationId(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete specification?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. The selected product
                            specification will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={deleteSpecification}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={!!deletingImageId}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingImageId(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete image?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. The selected product
                            image will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={deleteImage}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
