import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import MediaImagePicker from '@/components/media/MediaImagePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Textarea from '@/components/ui/textarea';

interface TypeOption {
    value: string;
    label: string;
}

interface Props {
    typeOptions: TypeOption[];
}

interface FormData {
    name: string;
    slug: string;
    type: string;
    title: string;
    description: string;
    banner_image: string | null;
    is_active: boolean;
    show_home: boolean;
    start_at: string;
    end_at: string;
    sort_order: number;
}

export default function Create({ typeOptions }: Props) {
    const { data, setData, post, processing, errors, transform } =
        useForm<FormData>({
            name: '',
            slug: '',
            type: 'promo',
            title: '',
            description: '',
            banner_image: null,
            is_active: true,
            show_home: false,
            start_at: '',
            end_at: '',
            sort_order: 0,
        });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        transform((current) => ({
            ...current,
            start_at: current.start_at || null,
            end_at: current.end_at || null,
            slug: current.slug || null,
            title: current.title || null,
            description: current.description || null,
        }));

        post('/my-admin/dashboard/ecommerce/product-collections', {
            forceFormData: true,
        });
    };

    return (
        <>
            <Head title="Create Product Collection" />

            <div className="container mx-auto max-w-4xl space-y-8 px-6 py-8">
                <div className="flex items-center gap-4">
                    <Link href="/my-admin/dashboard/ecommerce/product-collections">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Create Product Collection
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Add new promo/home section without changing product
                            schema.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Name" required>
                            <Input
                                value={data.name}
                                onChange={(event) =>
                                    setData('name', event.target.value)
                                }
                                placeholder="Best Seller"
                            />
                            <Error message={errors.name} />
                        </Field>

                        <Field label="Slug">
                            <Input
                                value={data.slug}
                                onChange={(event) =>
                                    setData('slug', event.target.value)
                                }
                                placeholder="best-seller"
                            />
                            <Error message={errors.slug} />
                        </Field>

                        <Field label="Type">
                            <select
                                value={data.type}
                                onChange={(event) =>
                                    setData('type', event.target.value)
                                }
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                {typeOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <Error message={errors.type} />
                        </Field>

                        <Field label="Sort Order">
                            <Input
                                type="number"
                                min={0}
                                value={data.sort_order}
                                onChange={(event) =>
                                    setData(
                                        'sort_order',
                                        Number(event.target.value || 0),
                                    )
                                }
                            />
                            <Error message={errors.sort_order} />
                        </Field>

                        <Field label="Title" className="md:col-span-2">
                            <Input
                                value={data.title}
                                onChange={(event) =>
                                    setData('title', event.target.value)
                                }
                                placeholder="Optional section title"
                            />
                            <Error message={errors.title} />
                        </Field>

                        <Field label="Description" className="md:col-span-2">
                            <Textarea
                                rows={4}
                                value={data.description}
                                onChange={(event) =>
                                    setData('description', event.target.value)
                                }
                                placeholder="Optional section description"
                            />
                            <Error message={errors.description} />
                        </Field>

                        <Field label="Banner Image" className="md:col-span-2">
                            <MediaImagePicker
                                value={data.banner_image}
                                onChange={(path) =>
                                    setData('banner_image', path)
                                }
                            />
                            <Error message={errors.banner_image} />
                        </Field>

                        <Field label="Start At">
                            <Input
                                type="datetime-local"
                                value={data.start_at}
                                onChange={(event) =>
                                    setData('start_at', event.target.value)
                                }
                            />
                            <Error message={errors.start_at} />
                        </Field>

                        <Field label="End At">
                            <Input
                                type="datetime-local"
                                value={data.end_at}
                                onChange={(event) =>
                                    setData('end_at', event.target.value)
                                }
                            />
                            <Error message={errors.end_at} />
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                            <Label htmlFor="is_active">Active</Label>
                            <Switch
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) =>
                                    setData('is_active', checked)
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                            <Label htmlFor="show_home">Show on Home</Label>
                            <Switch
                                id="show_home"
                                checked={data.show_home}
                                onCheckedChange={(checked) =>
                                    setData('show_home', checked)
                                }
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link href="/my-admin/dashboard/ecommerce/product-collections">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Create Collection'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

function Field({
    label,
    required = false,
    className = '',
    children,
}: {
    label: string;
    required?: boolean;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={`space-y-2 ${className}`}>
            <Label>
                {label}
                {required ? ' *' : ''}
            </Label>
            {children}
        </div>
    );
}

function Error({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-xs text-destructive">{message}</p>;
}
