import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
} from '@headlessui/react';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import InputError from '@/components/input-error';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface MultiSearchableSelectOption {
    value: string;
    label: string;
    description?: string | null;
    disabled?: boolean;
}

interface MultiSearchableSelectProps {
    options: MultiSearchableSelectOption[];
    value?: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    error?: string;
    disabled?: boolean;
    loading?: boolean;
    clearable?: boolean;
    filterOptions?: boolean;
    onSearchChange?: (query: string) => void;
    className?: string;
    inputClassName?: string;
}

export default function MultiSearchableSelect({
    options,
    value = [],
    onChange,
    placeholder = 'Select options',
    searchPlaceholder = 'Search...',
    emptyMessage = 'No options found.',
    error,
    disabled = false,
    loading = false,
    clearable = false,
    filterOptions = true,
    onSearchChange,
    className,
    inputClassName,
}: MultiSearchableSelectProps) {
    const [query, setQuery] = useState('');

    const selectedOptions = useMemo(
        () => options.filter((option) => value.includes(option.value)),
        [options, value],
    );

    const filteredOptions = useMemo(() => {
        const keyword = query.trim().toLowerCase();

        if (!filterOptions || !keyword) {
            return options;
        }

        return options.filter((option) =>
            [option.label, option.description]
                .filter(Boolean)
                .some((text) => text!.toLowerCase().includes(keyword)),
        );
    }, [filterOptions, options, query]);

    const handleSelect = (selectedOption: MultiSearchableSelectOption) => {
        const isSelected = value.includes(selectedOption.value);
        let newValue;
        if (isSelected) {
            newValue = value.filter((v) => v !== selectedOption.value);
        } else {
            newValue = [...value, selectedOption.value];
        }
        onChange(newValue);
    };

    const removeOption = (e: React.MouseEvent, optionValue: string) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(value.filter((v) => v !== optionValue));
    };

    return (
        <div className={cn('w-full space-y-1', className)}>
            <Combobox
                value={selectedOptions}
                onChange={(option: MultiSearchableSelectOption[] | any) => {
                    // HeadlessUI onChange receives an array when multiple={true}
                    // but we manage selection manually on option click for finer control or handle it via Headless UI array
                    if (Array.isArray(option)) {
                         onChange(option.map(o => o.value));
                    }
                }}
                disabled={disabled || loading}
                onClose={() => setQuery('')}
                multiple
                immediate
            >
                <div className="relative">
                    <div
                        className={cn(
                            'flex w-full min-w-0 flex-wrap items-center gap-1 rounded-md border border-input bg-transparent py-1 pr-14 pl-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 md:text-sm dark:bg-input/30',
                            error && 'border-destructive bg-red-50 ring-destructive/20 dark:aria-invalid:ring-destructive/40',
                            (disabled || loading) && 'cursor-not-allowed opacity-50',
                            inputClassName,
                        )}
                    >
                        {selectedOptions.map((option) => (
                            <Badge
                                key={option.value}
                                variant="secondary"
                                className="flex items-center gap-1 py-0 px-2 h-6"
                            >
                                {option.label}
                                <button
                                    type="button"
                                    onClick={(e) => removeOption(e, option.value)}
                                    className="ml-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground outline-none"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                        <ComboboxInput
                            className="flex-1 min-w-[100px] border-none bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground focus:ring-0"
                            displayValue={() => ''}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                onSearchChange?.(event.target.value);
                            }}
                            placeholder={
                                selectedOptions.length > 0 ? searchPlaceholder : placeholder
                            }
                        />
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        {loading && (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {clearable && value.length > 0 && !disabled && !loading && (
                            <button
                                type="button"
                                className="rounded-sm p-1 text-muted-foreground transition hover:text-foreground"
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    onChange([]);
                                    setQuery('');
                                }}
                                aria-label="Clear selection"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        <ComboboxButton className="rounded-sm p-1 text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50">
                            <ChevronsUpDown className="h-4 w-4" />
                        </ComboboxButton>
                    </div>

                    <ComboboxOptions className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md empty:hidden">
                        {filteredOptions.length === 0 && (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                {emptyMessage}
                            </div>
                        )}

                        {filteredOptions.map((option) => (
                            <ComboboxOption
                                key={option.value}
                                value={option}
                                disabled={option.disabled}
                                className={({ focus, disabled }) =>
                                    cn(
                                        'relative cursor-default rounded-sm py-2 pr-8 pl-3 text-sm select-none',
                                        focus && 'bg-accent text-accent-foreground',
                                        value.includes(option.value) && 'bg-accent/60 text-accent-foreground',
                                        disabled && 'pointer-events-none opacity-50',
                                    )
                                }
                            >
                                {() => (
                                    <>
                                        <span className="block truncate font-medium">
                                            {option.label}
                                        </span>
                                        {option.description && (
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {option.description}
                                            </span>
                                        )}
                                        {value.includes(option.value) && (
                                            <span className="absolute inset-y-0 right-2 flex items-center">
                                                <Check className="h-4 w-4" />
                                            </span>
                                        )}
                                    </>
                                )}
                            </ComboboxOption>
                        ))}
                    </ComboboxOptions>
                </div>
            </Combobox>
            <InputError message={error} />
        </div>
    );
}
