import type { DynamicFieldDefinition } from '@/types/dynamic-content';
import MediaLibraryFieldPicker from '@/components/dynamic-content/MediaLibraryFieldPicker';

interface Props {
    field: DynamicFieldDefinition;
    value: unknown;
    error?: string;
    mediaLibrary?: {
        index: string;
        store: string;
    };
    onChange: (value: unknown) => void;
}

export default function DynamicFieldInput({
    field,
    value,
    error,
    mediaLibrary,
    onChange,
}: Props) {
    return (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-900">
                    {field.label}
                    {field.is_required ? ' *' : ''}
                </label>
                {field.instructions && (
                    <p className="text-xs text-slate-500">{field.instructions}</p>
                )}
            </div>

            {renderInput(field, value, mediaLibrary, onChange)}

            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}

function renderInput(
    field: DynamicFieldDefinition,
    value: unknown,
    mediaLibrary: Props['mediaLibrary'],
    onChange: (value: unknown) => void,
) {
    const baseClass =
        'w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200';

    switch (field.type) {
        case 'textarea':
            return (
                <textarea
                    rows={4}
                    className={baseClass}
                    placeholder={field.placeholder ?? undefined}
                    value={String(value ?? '')}
                    onChange={(event) => onChange(event.target.value)}
                />
            );
        case 'number':
            return (
                <input
                    type="number"
                    className={baseClass}
                    placeholder={field.placeholder ?? undefined}
                    value={value === null || value === undefined ? '' : String(value)}
                    onChange={(event) => onChange(event.target.value)}
                />
            );
        case 'select':
            return (
                <select
                    className={baseClass}
                    value={String(value ?? '')}
                    onChange={(event) => onChange(event.target.value)}
                >
                    <option value="">{field.placeholder ?? 'Select an option'}</option>
                    {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            );
        case 'radio':
            return (
                <div className="space-y-2">
                    {field.options.map((option) => (
                        <label key={option.value} className="flex items-center gap-2 text-sm text-slate-700">
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
            const selected = Array.isArray(value) ? value.map(String) : [];

            return (
                <div className="space-y-2">
                    {field.options.map((option) => (
                        <label key={option.value} className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={selected.includes(option.value)}
                                onChange={(event) => {
                                    if (event.target.checked) {
                                        onChange([...selected, option.value]);

                                        return;
                                    }

                                    onChange(selected.filter((item) => item !== option.value));
                                }}
                            />
                            <span>{option.label}</span>
                        </label>
                    ))}
                </div>
            );
        }
        case 'true_false':
            return (
                <label className="flex items-center gap-3 text-sm text-slate-700">
                    <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(event) => onChange(event.target.checked)}
                    />
                    <span>Enabled</span>
                </label>
            );
        case 'image':
        case 'file':
            return mediaLibrary ? (
                <MediaLibraryFieldPicker
                    endpoints={mediaLibrary}
                    values={value ? [String(value)] : []}
                    onChange={(values) => onChange(values[0] ?? null)}
                />
            ) : (
                <input
                    type="text"
                    className={baseClass}
                    value={String(value ?? '')}
                    onChange={(event) => onChange(event.target.value)}
                />
            );
        case 'gallery':
            return mediaLibrary ? (
                <MediaLibraryFieldPicker
                    endpoints={mediaLibrary}
                    values={Array.isArray(value) ? value.map(String) : []}
                    multiple
                    onChange={(values) => onChange(values)}
                />
            ) : (
                <textarea
                    rows={4}
                    className={baseClass}
                    placeholder="One path per line"
                    value={Array.isArray(value) ? value.join('\n') : ''}
                    onChange={(event) =>
                        onChange(
                            event.target.value
                                .split('\n')
                                .map((item) => item.trim())
                                .filter(Boolean),
                        )
                    }
                />
            );
        case 'wysiwyg':
            return (
                <div className="space-y-2">
                    <textarea
                        rows={8}
                        className={baseClass}
                        placeholder={field.placeholder ?? 'Write rich text / HTML content'}
                        value={String(value ?? '')}
                        onChange={(event) => onChange(event.target.value)}
                    />
                    <p className="text-xs text-slate-500">
                        HTML content is supported. You can swap this textarea with TinyMCE or TipTap later if needed.
                    </p>
                </div>
            );
        case 'date':
            return (
                <input
                    type="date"
                    className={baseClass}
                    value={String(value ?? '')}
                    onChange={(event) => onChange(event.target.value)}
                />
            );
        case 'datetime':
            return (
                <input
                    type="datetime-local"
                    className={baseClass}
                    value={String(value ?? '')}
                    onChange={(event) => onChange(event.target.value)}
                />
            );
        case 'json':
            return (
                <textarea
                    rows={8}
                    className={`${baseClass} font-mono text-xs`}
                    placeholder='{"key":"value"}'
                    value={String(value ?? '')}
                    onChange={(event) => onChange(event.target.value)}
                />
            );
        case 'text':
        default:
            return (
                <input
                    type="text"
                    className={baseClass}
                    placeholder={field.placeholder ?? undefined}
                    value={String(value ?? '')}
                    onChange={(event) => onChange(event.target.value)}
                />
            );
    }
}
