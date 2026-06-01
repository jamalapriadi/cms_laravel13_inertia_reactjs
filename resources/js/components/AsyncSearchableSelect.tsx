import { useEffect, useMemo, useState } from 'react';

import SearchableSelect from '@/components/SearchableSelect';
import type { SearchableSelectOption } from '@/components/SearchableSelect';

interface AsyncSearchableSelectProps {
    value?: string | null;
    onChange: (value: string | null) => void;
    loadOptions: (query: string) => Promise<SearchableSelectOption[]>;
    initialOption?: SearchableSelectOption | null;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    error?: string;
    disabled?: boolean;
    clearable?: boolean;
    debounceMs?: number;
    minQueryLength?: number;
}

export default function AsyncSearchableSelect({
    value,
    onChange,
    loadOptions,
    initialOption = null,
    placeholder,
    searchPlaceholder,
    emptyMessage,
    error,
    disabled = false,
    clearable = false,
    debounceMs = 300,
    minQueryLength = 0,
}: AsyncSearchableSelectProps) {
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<SearchableSelectOption[]>(
        initialOption ? [initialOption] : [],
    );
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query.trim().length < minQueryLength) {
            return;
        }

        let cancelled = false;
        const timeout = window.setTimeout(() => {
            setLoading(true);

            loadOptions(query)
                .then((loadedOptions) => {
                    if (cancelled) {
                        return;
                    }

                    setOptions((current) => {
                        const selected = current.find(
                            (option) => option.value === value,
                        );
                        const merged = selected
                            ? [selected, ...loadedOptions]
                            : loadedOptions;

                        return merged.filter(
                            (option, index, items) =>
                                items.findIndex(
                                    (item) => item.value === option.value,
                                ) === index,
                        );
                    });
                })
                .finally(() => {
                    if (!cancelled) {
                        setLoading(false);
                    }
                });
        }, debounceMs);

        return () => {
            cancelled = true;
            window.clearTimeout(timeout);
        };
    }, [debounceMs, loadOptions, minQueryLength, query, value]);

    const searchableOptions = useMemo(() => {
        if (
            !initialOption ||
            options.some((option) => option.value === initialOption.value)
        ) {
            return options;
        }

        return [initialOption, ...options];
    }, [initialOption, options]);

    return (
        <SearchableSelect
            options={searchableOptions}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            searchPlaceholder={searchPlaceholder}
            emptyMessage={emptyMessage}
            error={error}
            disabled={disabled}
            loading={loading}
            clearable={clearable}
            filterOptions={false}
            onSearchChange={setQuery}
        />
    );
}
