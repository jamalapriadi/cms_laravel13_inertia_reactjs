import { Link, useForm } from '@inertiajs/react';
import type React from 'react';
import { toast } from 'sonner';

import {
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/Dashboard/CustomFieldGroupController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Textarea from '@/components/ui/textarea';
import type {
    CustomFieldGroupSummary,
    DynamicContentType,
} from '@/types/dynamic-content';

interface Props {
    mode: 'create' | 'edit';
    contentTypes: DynamicContentType[];
    customFieldGroup?: CustomFieldGroupSummary;
}

interface FormData {
    name: string;
    slug: string;
    description: string;
    content_type_id: string;
    is_active: boolean;
    sort_order: number;
}

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export default function GroupForm({
    mode,
    contentTypes,
    customFieldGroup,
}: Props) {
    const { data, setData, post, put, processing, errors } = useForm<FormData>({
        name: customFieldGroup?.name ?? '',
        slug: customFieldGroup?.slug ?? '',
        description: customFieldGroup?.description ?? '',
        content_type_id:
            customFieldGroup?.content_type?.id ?? contentTypes[0]?.id ?? '',
        is_active: customFieldGroup?.is_active ?? true,
        sort_order: customFieldGroup?.sort_order ?? 0,
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        const callback = mode === 'create' ? post : put;
        const url =
            mode === 'create'
                ? store().url
                : update({
                    customFieldGroup: customFieldGroup?.id ?? '',
                }).url;

        callback(url, {
            preserveScroll: true,
            onStart: () =>
                toast.loading(
                    mode === 'create' ? 'Creating field group...' : 'Updating field group...',
                    { id: 'custom-field-group' },
                ),
            onSuccess: () =>
                toast.success(
                    mode === 'create' ? 'Field group created.' : 'Field group updated.',
                    { id: 'custom-field-group' },
                ),
            onError: () =>
                toast.error('Please check the form fields.', {
                    id: 'custom-field-group',
                }),
        });
    };

    return (
        <form
            onSubmit={submit}
            className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
            <div className="grid gap-4 md:grid-cols-2">
                <Field label="Group Name" required>
                    <Input
                        value={data.name}
                        onChange={(event) => {
                            const nextName = event.target.value;
                            setData('name', nextName);

                            if (!data.slug || data.slug === slugify(data.name)) {
                                setData('slug', slugify(nextName));
                            }
                        }}
                        placeholder="Testimonial Fields"
                    />
                    <Error message={errors.name} />
                </Field>

                <Field label="Slug" required>
                    <Input
                        value={data.slug}
                        onChange={(event) =>
                            setData('slug', slugify(event.target.value))
                        }
                        placeholder="testimonial-fields"
                    />
                    <Error message={errors.slug} />
                </Field>

                <Field label="Content Type" required>
                    <select
                        value={data.content_type_id}
                        onChange={(event) =>
                            setData('content_type_id', event.target.value)
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        {contentTypes.map((contentType) => (
                            <option key={contentType.id} value={contentType.id}>
                                {contentType.name}
                            </option>
                        ))}
                    </select>
                    <Error message={errors.content_type_id} />
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

                <Field label="Description" className="md:col-span-2">
                    <Textarea
                        rows={4}
                        value={data.description}
                        onChange={(event) =>
                            setData('description', event.target.value)
                        }
                        placeholder="Describe the purpose of this field group"
                    />
                    <Error message={errors.description} />
                </Field>
            </div>

            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div>
                    <Label htmlFor="custom-field-group-active">Active</Label>
                    <p className="text-xs text-muted-foreground">
                        Active groups are used in dynamic entry forms and public API output.
                    </p>
                </div>
                <Switch
                    id="custom-field-group-active"
                    checked={data.is_active}
                    onCheckedChange={(checked) => setData('is_active', checked)}
                />
            </div>

            <div className="flex justify-end gap-3">
                <Link href={index().url}>
                    <Button type="button" variant="outline">
                        Cancel
                    </Button>
                </Link>
                <Button type="submit" disabled={processing}>
                    {processing
                        ? 'Saving...'
                        : mode === 'create'
                          ? 'Create Field Group'
                          : 'Update Field Group'}
                </Button>
            </div>
        </form>
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
