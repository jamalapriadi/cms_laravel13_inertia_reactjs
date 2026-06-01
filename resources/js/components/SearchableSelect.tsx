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

export interface SearchableSelectOption {
    value: string;
    label: string;
    description?: string | null;
    disabled?: boolean;
}

interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value?: string | null;
    onChange: (value: string | null) => void;
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

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    searchPlaceholder,
    emptyMessage = 'No options found.',
    error,
    disabled = false,
    loading = false,
    clearable = false,
    filterOptions = true,
    onSearchChange,
    className,
    inputClassName,
}: SearchableSelectProps) {
    const [query, setQuery] = useState('');

    const selectedOption = useMemo(
        () => options.find((option) => option.value === value) ?? null,
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

    return (
        <div className={cn('w-full space-y-1', className)}>
            <Combobox
                value={selectedOption}
                onChange={(option: SearchableSelectOption | null) =>
                    onChange(option?.value ?? null)
                }
                disabled={disabled || loading}
                onClose={() => setQuery('')}
                immediate
            >
                <div className="relative">
                    <ComboboxInput
                        aria-invalid={!!error}
                        className={cn(
                            'flex h-10 w-full min-w-0 rounded-md border border-input bg-transparent py-1 pr-20 pl-3 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:bg-red-50 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40',
                            inputClassName,
                        )}
                        displayValue={(option: SearchableSelectOption | null) =>
                            option?.label ?? ''
                        }
                        onChange={(event) => {
                            setQuery(event.target.value);
                            onSearchChange?.(event.target.value);
                        }}
                        placeholder={
                            selectedOption ? searchPlaceholder : placeholder
                        }
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        {loading && (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {clearable &&
                            selectedOption &&
                            !disabled &&
                            !loading && (
                                <button
                                    type="button"
                                    className="rounded-sm p-1 text-muted-foreground transition hover:text-foreground"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        onChange(null);
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
                                className={({ focus, selected, disabled }) =>
                                    cn(
                                        'relative cursor-default rounded-sm py-2 pr-8 pl-3 text-sm select-none',
                                        focus &&
                                            'bg-accent text-accent-foreground',
                                        selected &&
                                            'bg-accent/60 text-accent-foreground',
                                        disabled &&
                                            'pointer-events-none opacity-50',
                                    )
                                }
                            >
                                {({ selected }) => (
                                    <>
                                        <span className="block truncate font-medium">
                                            {option.label}
                                        </span>
                                        {option.description && (
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {option.description}
                                            </span>
                                        )}
                                        {selected && (
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
