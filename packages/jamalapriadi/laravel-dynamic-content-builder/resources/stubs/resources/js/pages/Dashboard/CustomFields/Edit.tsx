import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

import type {
    CustomFieldGroupSummary,
    DynamicFieldDefinition,
    DynamicFieldOption,
    DynamicContentType,
} from '@/types/dynamic-content';
import GroupForm from './GroupForm';

interface Props {
    customFieldGroup: CustomFieldGroupSummary;
    contentTypes: DynamicContentType[];
    fieldTypeOptions: DynamicFieldOption[];
    urls: Record<string, string>;
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

export default function Edit({
    customFieldGroup,
    contentTypes,
    fieldTypeOptions,
    urls,
}: Props) {
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
    const { data, setData, post, put, processing, errors, reset } = useForm<FieldFormData>(emptyFieldForm());

    const beginEdit = (field: DynamicFieldDefinition) => {
        setEditingFieldId(field.id);
        setData(deserializeField(field));
    };

    const submitField = (event: React.FormEvent) => {
        event.preventDefault();

        if (editingFieldId) {
            put(urls.field_update.replace('__FIELD__', editingFieldId));

            return;
        }

        post(urls.field_store);
    };

    const resetFieldForm = () => {
        setEditingFieldId(null);
        reset();
        setData(emptyFieldForm());
    };

    return (
        <>
            <Head title={`Edit ${customFieldGroup.name}`} />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Edit Field Group
                    </h1>
                    <p className="text-sm text-slate-500">
                        Manage the field group details and the dynamic field definitions below.
                    </p>
                </div>

                <GroupForm
                    mode="edit"
                    customFieldGroup={customFieldGroup}
                    contentTypes={contentTypes}
                    urls={urls}
                />

                <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Custom Fields
                            </h2>
                            <p className="text-sm text-slate-500">
                                Add or update fields that belong to this group.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={resetFieldForm}
                            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            New Field
                        </button>
                    </div>

                    <form onSubmit={submitField} className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                        <Field label="Label" required>
                            <input
                                type="text"
                                className={inputClass}
                                value={data.label}
                                onChange={(event) => setData('label', event.target.value)}
                            />
                            <Error message={errors.label} />
                        </Field>

                        <Field label="Field Name" required>
                            <input
                                type="text"
                                className={inputClass}
                                value={data.name}
                                onChange={(event) => setData('name', event.target.value)}
                            />
                            <Error message={errors.name} />
                        </Field>

                        <Field label="Type" required>
                            <select
                                className={inputClass}
                                value={data.type}
                                onChange={(event) => setData('type', event.target.value)}
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
                            <input
                                type="number"
                                min={0}
                                className={inputClass}
                                value={data.sort_order}
                                onChange={(event) => setData('sort_order', Number(event.target.value || 0))}
                            />
                            <Error message={errors.sort_order} />
                        </Field>

                        <Field label="Placeholder">
                            <input
                                type="text"
                                className={inputClass}
                                value={data.placeholder}
                                onChange={(event) => setData('placeholder', event.target.value)}
                            />
                            <Error message={errors.placeholder} />
                        </Field>

                        <Field label="Default Value">
                            <textarea
                                rows={3}
                                className={inputClass}
                                value={data.default_value}
                                onChange={(event) => setData('default_value', event.target.value)}
                            />
                            <Error message={errors.default_value} />
                        </Field>

                        <Field label="Options" className="md:col-span-2">
                            <textarea
                                rows={4}
                                className={inputClass}
                                placeholder="One option per line, for example: Premium:premium"
                                value={data.options}
                                onChange={(event) => setData('options', event.target.value)}
                            />
                            <Error message={errors.options} />
                        </Field>

                        <Field label="Instructions" className="md:col-span-2">
                            <textarea
                                rows={3}
                                className={inputClass}
                                value={data.instructions}
                                onChange={(event) => setData('instructions', event.target.value)}
                            />
                            <Error message={errors.instructions} />
                        </Field>

                        <Field label="Validation Rules" className="md:col-span-2">
                            <textarea
                                rows={3}
                                className={inputClass}
                                placeholder="One rule per line, for example: max:255"
                                value={data.validation_rules}
                                onChange={(event) => setData('validation_rules', event.target.value)}
                            />
                            <Error message={errors.validation_rules} />
                        </Field>

                        <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={data.is_required}
                                onChange={(event) => setData('is_required', event.target.checked)}
                            />
                            <span>Required field</span>
                        </label>

                        <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(event) => setData('is_active', event.target.checked)}
                            />
                            <span>Active field</span>
                        </label>

                        <div className="flex flex-wrap gap-3 md:col-span-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                            >
                                {processing ? 'Saving...' : editingFieldId ? 'Update Field' : 'Add Field'}
                            </button>
                            <button
                                type="button"
                                onClick={resetFieldForm}
                                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Reset
                            </button>
                        </div>
                    </form>

                    <div className="space-y-3">
                        {(customFieldGroup.fields ?? []).length === 0 ? (
                            <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                                No fields have been added to this group yet.
                            </p>
                        ) : (
                            (customFieldGroup.fields ?? []).map((field, index) => (
                                <div
                                    key={field.id}
                                    className="rounded-lg border border-slate-200 p-4"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-medium text-slate-900">
                                                    {field.label}
                                                </h3>
                                                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                                    {field.type}
                                                </span>
                                                {!field.is_active && (
                                                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500">
                                                {field.name}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                type="button"
                                                onClick={() => beginEdit(field)}
                                                className="text-sm font-medium text-slate-700 hover:text-slate-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.patch(urls.field_move.replace('__FIELD__', field.id), {
                                                        direction: 'up',
                                                    })
                                                }
                                                disabled={index === 0}
                                                className="text-sm font-medium text-slate-700 hover:text-slate-900 disabled:opacity-40"
                                            >
                                                Up
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.patch(urls.field_move.replace('__FIELD__', field.id), {
                                                        direction: 'down',
                                                    })
                                                }
                                                disabled={index === (customFieldGroup.fields?.length ?? 1) - 1}
                                                className="text-sm font-medium text-slate-700 hover:text-slate-900 disabled:opacity-40"
                                            >
                                                Down
                                            </button>
                                            <Link
                                                href={urls.field_destroy.replace('__FIELD__', field.id)}
                                                method="delete"
                                                as="button"
                                                className="text-sm font-medium text-red-600 hover:text-red-700"
                                            >
                                                Delete
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
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
            <label className="block text-sm font-medium text-slate-900">
                {label}
                {required ? ' *' : ''}
            </label>
            {children}
        </div>
    );
}

function Error({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-sm text-red-600">{message}</p>;
}

function emptyFieldForm(): FieldFormData {
    return {
        label: '',
        name: '',
        type: 'text',
        placeholder: '',
        instructions: '',
        options: '',
        default_value: '',
        validation_rules: '',
        is_required: false,
        is_active: true,
        sort_order: 0,
    };
}

function deserializeField(field: DynamicFieldDefinition): FieldFormData {
    return {
        label: field.label,
        name: field.name,
        type: field.type,
        placeholder: field.placeholder ?? '',
        instructions: field.instructions ?? '',
        options: (field.options ?? [])
            .map((option) => `${option.label}:${option.value}`)
            .join('\n'),
        default_value:
            typeof field.default_value === 'string'
                ? field.default_value
                : field.default_value === null || field.default_value === undefined
                  ? ''
                  : JSON.stringify(field.default_value, null, 2),
        validation_rules: (field.validation_rules ?? []).join('\n'),
        is_required: field.is_required,
        is_active: field.is_active,
        sort_order: field.sort_order,
    };
}

const inputClass =
    'w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200';
