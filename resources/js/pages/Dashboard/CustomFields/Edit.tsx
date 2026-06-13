import { Head, router, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
    destroyField,
    moveField,
    storeField,
    updateField,
} from '@/actions/App/Http/Controllers/Dashboard/CustomFieldGroupController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Textarea from '@/components/ui/textarea';
import { usePermission } from '@/lib/permissions';
import type {
    CustomFieldGroupSummary,
    DynamicContentType,
    DynamicFieldDefinition,
} from '@/types/dynamic-content';
import GroupForm from './GroupForm';

interface Props {
    customFieldGroup: CustomFieldGroupSummary;
    contentTypes: DynamicContentType[];
    fieldTypeOptions: Array<{
        value: string;
        label: string;
    }>;
}

interface FieldFormData {
    label: string;
    name: string;
    type: string;
    placeholder: string;
    instructions: string;
    options: string;
    default_value: string;
    validation_rules: string;
    is_required: boolean;
    is_active: boolean;
    sort_order: number;
}

const supportsOptions = (type: string) =>
    ['select', 'radio', 'checkbox'].includes(type);

const slugifyName = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

const fieldToFormData = (field?: DynamicFieldDefinition): FieldFormData => ({
    label: field?.label ?? '',
    name: field?.name ?? '',
    type: field?.type ?? 'text',
    placeholder: field?.placeholder ?? '',
    instructions: field?.instructions ?? '',
    options:
        field?.options?.map((option) => `${option.label}:${option.value}`).join('\n') ??
        '',
    default_value:
        field?.type === 'json'
            ? String(field.default_value ?? '')
            : Array.isArray(field?.default_value)
              ? field.default_value.join('\n')
              : String(field?.default_value ?? ''),
    validation_rules: field?.validation_rules?.join('\n') ?? '',
    is_required: field?.is_required ?? false,
    is_active: field?.is_active ?? true,
    sort_order: field?.sort_order ?? 0,
});

export default function Edit({
    customFieldGroup,
    contentTypes,
    fieldTypeOptions,
}: Props) {
    const { hasPermission } = usePermission();
    const canCreate = hasPermission('custom-fields.create');
    const canEdit = hasPermission('custom-fields.edit');
    const canDelete = hasPermission('custom-fields.delete');
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
    const [isFieldFormOpen, setIsFieldFormOpen] = useState(false);
    const { data, setData, post, put, processing, errors, reset } =
        useForm<FieldFormData>(fieldToFormData());

    const openCreateForm = () => {
        reset();
        setData(fieldToFormData());
        setEditingFieldId(null);
        setIsFieldFormOpen(true);
    };

    const openEditForm = (field: DynamicFieldDefinition) => {
        setData(fieldToFormData(field));
        setEditingFieldId(field.id);
        setIsFieldFormOpen(true);
    };

    const closeFieldForm = () => {
        reset();
        setData(fieldToFormData());
        setEditingFieldId(null);
        setIsFieldFormOpen(false);
    };

    const submitField = (event: React.FormEvent) => {
        event.preventDefault();

        const callback = editingFieldId ? put : post;
        const url = editingFieldId
            ? updateField({
                customFieldGroup: customFieldGroup.id,
                customField: editingFieldId,
            }).url
            : storeField({ customFieldGroup: customFieldGroup.id }).url;

        callback(url, {
            preserveScroll: true,
            onStart: () =>
                toast.loading(
                    editingFieldId ? 'Updating field...' : 'Creating field...',
                    { id: 'custom-field-item' },
                ),
            onSuccess: () => {
                toast.success(
                    editingFieldId ? 'Custom field updated.' : 'Custom field created.',
                    { id: 'custom-field-item' },
                );
                closeFieldForm();
            },
            onError: () =>
                toast.error('Please check the custom field form.', {
                    id: 'custom-field-item',
                }),
        });
    };

    const removeField = (fieldId: string) => {
        router.delete(
            destroyField({
                customFieldGroup: customFieldGroup.id,
                customField: fieldId,
            }).url,
            {
                preserveScroll: true,
            },
        );
    };

    const reorderField = (fieldId: string, direction: 'up' | 'down') => {
        router.patch(
            moveField({
                customFieldGroup: customFieldGroup.id,
                customField: fieldId,
            }).url,
            { direction },
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <>
            <Head title="Edit Field Group" />

            <div className="container mx-auto max-w-6xl space-y-8 px-6 py-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Field Group</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Update the group settings and manage the custom fields used by this content type.
                    </p>
                </div>

                <GroupForm
                    mode="edit"
                    contentTypes={contentTypes}
                    customFieldGroup={customFieldGroup}
                />

                <section className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Custom Fields</h2>
                            <p className="text-sm text-muted-foreground">
                                Add and maintain the field schema for {customFieldGroup.content_type?.name ?? 'this content type'}.
                            </p>
                        </div>

                        {canCreate && (
                            <Button onClick={openCreateForm} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Field
                            </Button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {(customFieldGroup.fields ?? []).map((field, indexField) => (
                            <div
                                key={field.id}
                                className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4 md:flex-row md:items-start md:justify-between"
                            >
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-medium">{field.label}</p>
                                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                                            {field.type}
                                        </span>
                                        {field.is_required && (
                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                                Required
                                            </span>
                                        )}
                                        {!field.is_active && (
                                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800 dark:bg-red-950/40 dark:text-red-300">
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                    <p className="font-mono text-xs text-muted-foreground">
                                        {field.name}
                                    </p>
                                    {field.instructions && (
                                        <p className="text-sm text-muted-foreground">
                                            {field.instructions}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {canEdit && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    reorderField(field.id, 'up')
                                                }
                                                disabled={indexField === 0}
                                            >
                                                <ArrowUp className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    reorderField(field.id, 'down')
                                                }
                                                disabled={
                                                    indexField ===
                                                    (customFieldGroup.fields?.length ?? 1) -
                                                        1
                                                }
                                            >
                                                <ArrowDown className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => openEditForm(field)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                        </>
                                    )}
                                    {canDelete && (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => removeField(field.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {(customFieldGroup.fields ?? []).length === 0 && (
                            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                                No custom fields yet. Add the first one to start building the schema.
                            </div>
                        )}
                    </div>

                    {isFieldFormOpen && (
                        <form
                            onSubmit={submitField}
                            className="space-y-6 rounded-xl border bg-background p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-semibold">
                                        {editingFieldId ? 'Edit Custom Field' : 'Add Custom Field'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Configure one field definition for the selected content type.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={closeFieldForm}
                                >
                                    Close
                                </Button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Label" required>
                                    <Input
                                        value={data.label}
                                        onChange={(event) => {
                                            const nextLabel = event.target.value;
                                            setData('label', nextLabel);

                                            if (!data.name || data.name === slugifyName(data.label)) {
                                                setData('name', slugifyName(nextLabel));
                                            }
                                        }}
                                        placeholder="Customer Name"
                                    />
                                    <Error message={errors.label} />
                                </Field>

                                <Field label="Field Name" required>
                                    <Input
                                        value={data.name}
                                        onChange={(event) =>
                                            setData('name', slugifyName(event.target.value))
                                        }
                                        placeholder="customer_name"
                                    />
                                    <Error message={errors.name} />
                                </Field>

                                <Field label="Field Type" required>
                                    <select
                                        value={data.type}
                                        onChange={(event) =>
                                            setData('type', event.target.value)
                                        }
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        {fieldTypeOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
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
                                            setData('sort_order', Number(event.target.value || 0))
                                        }
                                    />
                                    <Error message={errors.sort_order} />
                                </Field>

                                <Field label="Placeholder">
                                    <Input
                                        value={data.placeholder}
                                        onChange={(event) =>
                                            setData('placeholder', event.target.value)
                                        }
                                        placeholder="Optional placeholder"
                                    />
                                    <Error message={errors.placeholder} />
                                </Field>

                                <Field label="Default Value">
                                    {data.type === 'true_false' ? (
                                        <div className="flex items-center justify-between rounded-md border px-3 py-2">
                                            <span className="text-sm text-muted-foreground">
                                                Set default switch state
                                            </span>
                                            <Switch
                                                checked={data.default_value === 'true'}
                                                onCheckedChange={(checked) =>
                                                    setData(
                                                        'default_value',
                                                        checked ? 'true' : 'false',
                                                    )
                                                }
                                            />
                                        </div>
                                    ) : (
                                        <Textarea
                                            rows={data.type === 'json' ? 6 : 3}
                                            className={
                                                data.type === 'json'
                                                    ? 'font-mono text-xs'
                                                    : ''
                                            }
                                            value={data.default_value}
                                            onChange={(event) =>
                                                setData(
                                                    'default_value',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder={
                                                data.type === 'checkbox' ||
                                                data.type === 'gallery'
                                                    ? 'One item per line'
                                                    : data.type === 'json'
                                                      ? '{"key":"value"}'
                                                      : 'Optional default value'
                                            }
                                        />
                                    )}
                                    <Error message={errors.default_value} />
                                </Field>

                                <Field
                                    label="Instructions"
                                    className="md:col-span-2"
                                >
                                    <Textarea
                                        rows={3}
                                        value={data.instructions}
                                        onChange={(event) =>
                                            setData('instructions', event.target.value)
                                        }
                                        placeholder="Help text shown in the entry form"
                                    />
                                    <Error message={errors.instructions} />
                                </Field>

                                {supportsOptions(data.type) && (
                                    <Field
                                        label="Options"
                                        className="md:col-span-2"
                                    >
                                        <Textarea
                                            rows={5}
                                            value={data.options}
                                            onChange={(event) =>
                                                setData('options', event.target.value)
                                            }
                                            placeholder={'One option per line\nLabel:value'}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Use one option per line. Format can be `Label:value` or just `Label`.
                                        </p>
                                        <Error message={errors.options} />
                                    </Field>
                                )}

                                <Field
                                    label="Validation Rules"
                                    className="md:col-span-2"
                                >
                                    <Textarea
                                        rows={4}
                                        value={data.validation_rules}
                                        onChange={(event) =>
                                            setData(
                                                'validation_rules',
                                                event.target.value,
                                            )
                                        }
                                        placeholder={'max:255\nmin:3'}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        One Laravel validation rule per line.
                                    </p>
                                    <Error message={errors.validation_rules} />
                                </Field>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                    <div>
                                        <Label htmlFor="field-required">Required</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Require a value when creating or updating entries.
                                        </p>
                                    </div>
                                    <Switch
                                        id="field-required"
                                        checked={data.is_required}
                                        onCheckedChange={(checked) =>
                                            setData('is_required', checked)
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                    <div>
                                        <Label htmlFor="field-active">Active</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Inactive fields are hidden from entry forms and public output.
                                        </p>
                                    </div>
                                    <Switch
                                        id="field-active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) =>
                                            setData('is_active', checked)
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeFieldForm}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Saving...'
                                        : editingFieldId
                                          ? 'Update Field'
                                          : 'Create Field'}
                                </Button>
                            </div>
                        </form>
                    )}
                </section>
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
