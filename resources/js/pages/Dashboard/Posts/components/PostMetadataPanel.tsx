import { X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';

import MediaImagePicker from '@/components/media/MediaImagePicker';
import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type TaxonomyOption = {
    id: number;
    term?: {
        name?: string | null;
    } | null;
};

type CategoryOption = {
    id: string;
    category_name?: string | null;
};

interface Props {
    categories: CategoryOption[];
    tags: TaxonomyOption[];
    selectedCategoryId?: string | null;
    selectedTagNames: string[];
    featuredImage?: string | null;
    publishedAt?: string | null;
    onCategoryChange: (id: string) => void;
    onTagNamesChange: (names: string[]) => void;
    onFeaturedImageChange: (path: string | null) => void;
    onPublishedAtChange: (value: string) => void;
}

function TagInput({
    options,
    selectedNames,
    onChange,
}: {
    options: TaxonomyOption[];
    selectedNames: string[];
    onChange: (names: string[]) => void;
}) {
    const [input, setInput] = useState('');
    const normalizedSelected = useMemo(
        () => selectedNames.map((name) => name.toLowerCase()),
        [selectedNames],
    );
    const suggestions = options
        .map((option) => option.term?.name)
        .filter((name): name is string => Boolean(name))
        .filter((name) => !normalizedSelected.includes(name.toLowerCase()))
        .filter((name) => name.toLowerCase().includes(input.toLowerCase()))
        .slice(0, 8);

    const addTag = (name: string) => {
        const cleaned = name.trim();

        if (!cleaned) {
            return;
        }

        if (normalizedSelected.includes(cleaned.toLowerCase())) {
            setInput('');

            return;
        }

        onChange([...selectedNames, cleaned]);
        setInput('');
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        addTag(input);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            addTag(input.replace(',', ''));
        }

        if (event.key === 'Backspace' && !input && selectedNames.length > 0) {
            onChange(selectedNames.slice(0, -1));
        }
    };

    return (
        <section className="space-y-3">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Tags
            </h3>

            <div className="space-y-2">
                <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-md border bg-background p-2">
                    {selectedNames.map((name) => (
                        <Badge
                            key={name}
                            variant="secondary"
                            className="gap-1 pr-1"
                        >
                            {name}
                            <button
                                type="button"
                                onClick={() =>
                                    onChange(
                                        selectedNames.filter(
                                            (tagName) => tagName !== name,
                                        ),
                                    )
                                }
                                className="rounded p-0.5 hover:bg-muted"
                            >
                                <X className="size-3" />
                            </button>
                        </Badge>
                    ))}

                    <form
                        onSubmit={submit}
                        className="flex min-w-32 flex-1 gap-2"
                    >
                        <Input
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Tambah tag"
                            className="h-8 min-w-0 flex-1 border-0 px-1 shadow-none focus-visible:ring-0"
                        />
                        {/* <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="h-8"
                        >
                            Add
                        </Button> */}
                    </form>
                </div>

                {suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((name) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => addTag(name)}
                                className="rounded-md border bg-background px-2 py-1 text-xs hover:bg-muted"
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="text-xs text-muted-foreground">
                    Pisahkan tag dengan Enter atau koma.
                </div>
            </div>
        </section>
    );
}

export default function PostMetadataPanel({
    categories,
    tags,
    selectedCategoryId,
    selectedTagNames,
    featuredImage,
    publishedAt,
    onCategoryChange,
    onTagNamesChange,
    onFeaturedImageChange,
    onPublishedAtChange,
}: Props) {
    return (
        <div className="space-y-6">
            <section className="space-y-3">
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Post Settings
                </h2>

                <MediaImagePicker
                    label="Featured Image"
                    value={featuredImage}
                    onChange={onFeaturedImageChange}
                />
            </section>

            <section className="space-y-3">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Publish At
                </h3>

                <Input
                    type="datetime-local"
                    value={publishedAt ?? ''}
                    onChange={(event) =>
                        onPublishedAtChange(event.target.value)
                    }
                />
            </section>

            <section className="space-y-3">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Categories
                </h3>

                <Select
                    value={selectedCategoryId || 'none'}
                    onValueChange={(value) =>
                        onCategoryChange(value === 'none' ? '' : value)
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Tanpa category</SelectItem>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.category_name ?? category.id}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </section>

            <TagInput
                options={tags}
                selectedNames={selectedTagNames}
                onChange={onTagNamesChange}
            />
        </div>
    );
}
