import { useState, useEffect } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Textarea from '@/components/ui/textarea';
import TinyEditor from '@/components/ui/TinyEditor';
import type { DynamicFieldDefinition, DynamicFieldRelationConfig } from '@/types/dynamic-content';
import MediaLibraryFieldPicker from './MediaLibraryFieldPicker';

interface Props {
    field: DynamicFieldDefinition;
    value: unknown;
    error?: string;
    onChange: (value: unknown) => void;
}

export default function DynamicFieldInput({
    field,
    value,
    error,
    onChange,
}: Props) {
    return (
        <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
            <div className="space-y-1">
                <Label htmlFor={`field-${field.name}`}>
                    {field.label}
                    {field.is_required ? ' *' : ''}
                </Label>
                {field.instructions && (
                    <p className="text-xs text-muted-foreground">
                        {field.instructions}
                    </p>
                )}
            </div>

            {renderInput(field, value, onChange)}

            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

function renderInput(
    field: DynamicFieldDefinition,
    value: unknown,
    onChange: (value: unknown) => void,
) {
    switch (field.type) {
        case 'textarea':
            return (
                <Textarea
                    id={`field-${field.name}`}
                    rows={4}
                    placeholder={field.placeholder ?? undefined}
                    value={String(value ?? '')}
                    onChange={(event) => onChange(event.target.value)}
                />
            );
        case 'number':
            return (
                <Input
                    id={`field-${field.name}`}
                    type="number"
                    placeholder={field.placeholder ?? undefined}
                    value={
                        value === null || value === undefined
                            ? ''
                            : String(value)
                    }
                    onChange={(event) => onChange(event.target.value)}
                />
            );
        case 'select':
            return (
                <Select
                    value={String(value ?? '')}
                    onValueChange={(nextValue) => onChange(nextValue)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue
                            placeholder={field.placeholder ?? 'Select option'}
                        />
                    </SelectTrigger>
                    <SelectContent>
                        {field.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        case 'radio':
            return (
                <div className="space-y-3">
                    {field.options.map((option) => (
                        <label
                            key={option.value}
                            className="flex items-center gap-3 text-sm"
                        >
                            <input
                                type="radio"
                                name={field.name}
                                value={option.value}
                                checked={String(value ?? '') === option.value}
                                onChange={() => onChange(option.value)}
                            />
                            <span>{option.label}</span>
                        </label>
                    ))}
                </div>
            );
        case 'checkbox': {
            const selectedValues = Array.isArray(value) ? value : [];

            return (
                <div className="space-y-3">
                    {field.options.map((option) => {
                        const checked = selectedValues.includes(option.value);

                        return (
                            <label
                                key={option.value}
                                className="flex items-center gap-3 text-sm"
                            >
                                <Checkbox
                                    checked={checked}
                                    onCheckedChange={(nextChecked) => {
                                        if (nextChecked) {
                                            onChange([
                                                ...selectedValues,
                                                option.value,
                                            ]);

                                            return;
                                        }

                                        onChange(
                                            selectedValues.filter(
                                                (item) => item !== option.value,
                                            ),
                                        );
                                    }}
                                />
                                <span>{option.label}</span>
                            </label>
                        );
                    })}
                </div>
            );
        }
        case 'true_false':
            return (
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm text-muted-foreground">
                        Toggle this option
                    </span>
                    <Switch
                        checked={Boolean(value)}
                        onCheckedChange={(checked) => onChange(checked)}
                    />
                </div>
            );
        case 'image':
            return (
                <MediaLibraryFieldPicker
                    values={value ? [String(value)] : []}
                    onChange={(values) => onChange(values[0] ?? null)}
                />
            );
        case 'gallery':
            return (
                <MediaLibraryFieldPicker
                    values={Array.isArray(value) ? value.map(String) : []}
                    multiple
                    onChange={(values) => onChange(values)}
                />
            );
        case 'file':
            return (
                <MediaLibraryFieldPicker
                    values={value ? [String(value)] : []}
                    onChange={(values) => onChange(values[0] ?? null)}
                />
            );
        case 'wysiwyg':
            return (
                <TinyEditor
                    value={String(value ?? '')}
                    onChange={(content) => onChange(content)}
                    height={280}
                />
            );
        case 'date':
            return (
                <Input
                    id={`field-${field.name}`}
                    type="date"
                    value={String(value ?? '')}
                    onChange={(event) => onChange(event.target.value)}
                />
            );
        case 'datetime':
            return (
                <Input
                    id={`field-${field.name}`}
                    type="datetime-local"
                    value={String(value ?? '')}
                    onChange={(event) => onChange(event.target.value)}
                />
            );
        case 'json':
            return (
                <Textarea
                    id={`field-${field.name}`}
                    rows={8}
                    className="font-mono text-xs"
                    placeholder='{"key":"value"}'
                    value={String(value ?? '')}
                    onChange={(event) => onChange(event.target.value)}
                />
            );
        case 'relation':
            return (
                <RelationFieldInput
                    field={field}
                    value={value}
                    onChange={onChange}
                />
            );
        case 'text':
        default:
            return (
                <Input
                    id={`field-${field.name}`}
                    placeholder={field.placeholder ?? undefined}
                    value={String(value ?? '')}
                    onChange={(event) => onChange(event.target.value)}
                />
            );
    }
}

function RelationFieldInput({
    field,
    value,
    onChange,
}: {
    field: DynamicFieldDefinition;
    value: unknown;
    onChange: (value: unknown) => void;
}) {
    const config = field.options as unknown as DynamicFieldRelationConfig;
    const sourceContentTypeId = config?.source_content_type_id;
    const labelField = config?.label_field || 'title';
    const placeholder = config?.placeholder || field.placeholder || 'Select option';
    const isMultiple = config?.is_multiple || false;

    const [options, setOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sourceContentTypeId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        fetch(`/my-admin/dashboard/content-builder/content-types/${sourceContentTypeId}/entries/options?label_field=${labelField}`)
            .then((res) => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then((data) => {
                setOptions(data);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [sourceContentTypeId, labelField]);

    if (loading) {
        return <p className="text-xs text-muted-foreground animate-pulse">Loading options...</p>;
    }

    if (!sourceContentTypeId) {
        return <p className="text-xs text-destructive">Relation source not configured.</p>;
    }

    if (isMultiple) {
        const selectedValues = Array.isArray(value) ? value : [];
        return (
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                {options.map((option) => {
                    const checked = selectedValues.includes(option.value);
                    return (
                        <label
                            key={option.value}
                            className="flex items-center gap-3 text-sm py-1 cursor-pointer"
                        >
                            <Checkbox
                                checked={checked}
                                onCheckedChange={(nextChecked) => {
                                    if (nextChecked) {
                                        onChange([...selectedValues, option.value]);
                                    } else {
                                        onChange(selectedValues.filter((v) => v !== option.value));
                                    }
                                }}
                            />
                            <span>{option.label}</span>
                        </label>
                    );
                })}
                {options.length === 0 && (
                    <p className="text-xs text-muted-foreground">No options found.</p>
                )}
            </div>
        );
    }

    return (
        <Select
            value={value ? String(value) : ''}
            onValueChange={(nextValue) => onChange(nextValue || null)}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
