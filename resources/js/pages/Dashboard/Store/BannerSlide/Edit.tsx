import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import MediaImagePicker from '@/components/media/MediaImagePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Textarea from '@/components/ui/textarea';

interface OptionItem {
    value: string;
    label: string;
}

interface BannerSlide {
    id: string;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    image: string;
    image_url: string | null;
    mobile_image: string | null;
    mobile_image_url: string | null;
    button_text: string | null;
    button_url: string | null;
    type: string;
    position: string;
    is_active: boolean;
    sort_order: number;
    start_at: string | null;
    end_at: string | null;
}

interface Props {
    slide: BannerSlide;
    typeOptions: OptionItem[];
    positionOptions: OptionItem[];
}

interface FormData {
    title: string;
    subtitle: string;
    description: string;
    image: string | null;
    mobile_image: string | null;
    button_text: string;
    button_url: string;
    type: string;
    position: string;
    is_active: boolean;
    sort_order: number;
    start_at: string;
    end_at: string;
}

export default function Edit({ slide, typeOptions, positionOptions }: Props) {
    const { data, setData, post, processing, errors, transform } =
        useForm<FormData>({
            title: slide.title ?? '',
            subtitle: slide.subtitle ?? '',
            description: slide.description ?? '',
            image: slide.image,
            mobile_image: slide.mobile_image,
            button_text: slide.button_text ?? '',
            button_url: slide.button_url ?? '',
            type: slide.type,
            position: slide.position,
            is_active: slide.is_active,
            sort_order: slide.sort_order,
            start_at: toDatetimeLocal(slide.start_at),
            end_at: toDatetimeLocal(slide.end_at),
        });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        transform((current) => ({
            ...current,
            _method: 'put',
            title: current.title || null,
            subtitle: current.subtitle || null,
            description: current.description || null,
            button_text: current.button_text || null,
            button_url: current.button_url || null,
            start_at: current.start_at || null,
            end_at: current.end_at || null,
        }));

        post(`/my-admin/dashboard/ecommerce/banner-slides/${slide.id}`, {
            forceFormData: true,
        });
    };

    return (
        <>
            <Head title="Edit Banner Slide" />

            <div className="container mx-auto max-w-4xl space-y-8 px-6 py-8">
                <div className="flex items-center gap-4">
                    <Link href="/my-admin/dashboard/ecommerce/banner-slides">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Edit Banner Slide
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Update banner slide content.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Title">
                            <Input
                                value={data.title}
                                onChange={(event) =>
                                    setData('title', event.target.value)
                                }
                            />
                            <Error message={errors.title} />
                        </Field>

                        <Field label="Subtitle">
                            <Input
                                value={data.subtitle}
                                onChange={(event) =>
                                    setData('subtitle', event.target.value)
                                }
                            />
                            <Error message={errors.subtitle} />
                        </Field>

                        <Field label="Description" className="md:col-span-2">
                            <Textarea
                                rows={4}
                                value={data.description}
                                onChange={(event) =>
                                    setData('description', event.target.value)
                                }
                            />
                            <Error message={errors.description} />
                        </Field>

                        <Field label="Image" required>
                            <MediaImagePicker
                                value={data.image}
                                onChange={(path) => setData('image', path)}
                            />
                            <Error message={errors.image} />
                        </Field>

                        <Field label="Mobile Image">
                            <MediaImagePicker
                                value={data.mobile_image}
                                onChange={(path) =>
                                    setData('mobile_image', path)
                                }
                            />
                            <Error message={errors.mobile_image} />
                        </Field>

                        <Field label="Button Text">
                            <Input
                                value={data.button_text}
                                onChange={(event) =>
                                    setData('button_text', event.target.value)
                                }
                            />
                            <Error message={errors.button_text} />
                        </Field>

                        <Field label="Button URL">
                            <Input
                                value={data.button_url}
                                onChange={(event) =>
                                    setData('button_url', event.target.value)
                                }
                            />
                            <Error message={errors.button_url} />
                        </Field>

                        <Field label="Type" required>
                            <select
                                value={data.type}
                                onChange={(event) => setData('type', event.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                {typeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <Error message={errors.type} />
                        </Field>

                        <Field label="Position" required>
                            <select
                                value={data.position}
                                onChange={(event) =>
                                    setData('position', event.target.value)
                                }
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                {positionOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <Error message={errors.position} />
                        </Field>

                        <Field label="Sort Order">
                            <Input
                                type="number"
                                min={0}
                                value={data.sort_order}
                                onChange={(event) =>
                                    setData('sort_order', Number(event.target.value || 0))
                                }
                            />
                            <Error message={errors.sort_order} />
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
                                onChange={(event) => setData('end_at', event.target.value)}
                            />
                            <Error message={errors.end_at} />
                        </Field>
                    </div>

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

                    <div className="flex justify-end gap-3">
                        <Link href="/my-admin/dashboard/ecommerce/banner-slides">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Update Banner'}
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

function toDatetimeLocal(value: string | null): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const offset = date.getTimezoneOffset();
    const adjusted = new Date(date.getTime() - offset * 60_000);

    return adjusted.toISOString().slice(0, 16);
}
