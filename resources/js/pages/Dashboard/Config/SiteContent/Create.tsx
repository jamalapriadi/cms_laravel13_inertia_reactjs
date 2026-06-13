import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import MediaImagePicker from '@/components/media/MediaImagePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Textarea from '@/components/ui/textarea';

interface ActiveLanguage {
    code: string;
    name: string;
    default_locale: string | null;
}

interface OptionItem {
    value: string;
    label: string;
}

interface Props {
    activeLanguages: ActiveLanguage[];
    groupOptions: OptionItem[];
    typeOptions: OptionItem[];
}

interface FormData {
    key: string;
    group: string;
    type: string;
    is_active: boolean;
    sort_order: number;
    translations: Record<string, string>;
}

export default function Create({ activeLanguages, groupOptions, typeOptions }: Props) {
    const defaultTranslations = activeLanguages.reduce<Record<string, string>>((carry, language) => {
        carry[language.code] = '';

        return carry;
    }, {});

    const { data, setData, post, processing, errors, transform } = useForm<FormData>({
        key: '',
        group: 'homepage',
        type: 'text',
        is_active: true,
        sort_order: 0,
        translations: defaultTranslations,
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        transform((current) => ({
            ...current,
            group: current.group || null,
            translations: activeLanguages.map((language) => ({
                locale: language.code,
                value: current.translations[language.code] || null,
            })),
        }));

        post('/my-admin/dashboard/config/site-contents');
    };

    return (
        <>
            <Head title="Create Site Content" />

            <div className="container mx-auto max-w-5xl space-y-8 px-6 py-8">
                <div className="flex items-center gap-4">
                    <Link href="/my-admin/dashboard/config/site-contents">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create Site Content</h1>
                        <p className="text-sm text-muted-foreground">
                            Create dynamic content key with translations for active languages.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Key" required className="md:col-span-2">
                            <Input
                                placeholder="homepage.hero.title"
                                value={data.key}
                                onChange={(event) => setData('key', event.target.value)}
                            />
                            <Error message={errors.key} />
                        </Field>

                        <Field label="Group">
                            <select
                                value={data.group}
                                onChange={(event) => setData('group', event.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                {groupOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <Error message={errors.group} />
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
                    </div>

                    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                        <Label htmlFor="is_active">Active</Label>
                        <Switch
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(checked) => setData('is_active', checked)}
                        />
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-base font-semibold">Translations (Active Languages)</h2>
                        {activeLanguages.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                Tidak ada bahasa aktif. Aktifkan dulu di
                                {' '}
                                /my-admin/dashboard/config/language.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activeLanguages.map((language, index) => (
                                    <TranslationField
                                        key={language.code}
                                        language={language}
                                        type={data.type}
                                        value={data.translations[language.code] || ''}
                                        error={
                                            errors[`translations.${index}.value` as keyof typeof errors] as string | undefined
                                        }
                                        onChange={(value) =>
                                            setData('translations', {
                                                ...data.translations,
                                                [language.code]: value,
                                            })
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link href="/my-admin/dashboard/config/site-contents">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Create Content'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

function TranslationField({
    language,
    type,
    value,
    error,
    onChange,
}: {
    language: ActiveLanguage;
    type: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <Label>
                    {language.name} ({language.code.toUpperCase()})
                </Label>
                <span className="text-xs text-muted-foreground">
                    {language.default_locale || '-'}
                </span>
            </div>

            {renderValueInput(type, value, onChange)}

            <Error message={error} />
        </div>
    );
}

function renderValueInput(
    type: string,
    value: string,
    onChange: (value: string) => void,
) {
    if (type === 'textarea' || type === 'richtext') {
        return (
            <Textarea
                rows={4}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        );
    }

    if (type === 'image') {
        return <MediaImagePicker value={value || null} onChange={(path) => onChange(path || '')} />;
    }

    if (type === 'url') {
        return (
            <Input
                type="url"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        );
    }

    return <Input value={value} onChange={(event) => onChange(event.target.value)} />;
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
