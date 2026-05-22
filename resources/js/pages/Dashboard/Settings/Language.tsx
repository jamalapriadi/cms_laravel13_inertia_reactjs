import { Head, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface LanguageItem {
    id: number;
    code: string;
    english_name: string;
    default_locale: string;
}

interface Props {
    languages: LanguageItem[];
    availableLanguages: string[];
    defaultLanguage: string | null;
}

export default function Language({
    languages,
    availableLanguages,
    defaultLanguage,
}: Props) {
    const [initialized, setInitialized] = useState(false);

    const { data, setData, post, processing } = useForm({
        languages: [] as string[],
        default_language: '',
    });

    /**
     * ✅ Init state
     */
    useEffect(() => {
        if (initialized) {
            return;
        }

        setData({
            languages: availableLanguages ?? [],
            default_language: defaultLanguage ?? '',
        });

        setInitialized(true);
    }, [initialized, availableLanguages, defaultLanguage, setData]);

    /**
     * ✅ Toggle language
     */
    const toggleLanguage = (code: string) => {
        const exists = data.languages.includes(code);

        let updated: string[];

        if (exists) {
            updated = data.languages.filter((v) => v !== code);

            // reset default jika dihapus
            if (data.default_language === code) {
                setData({
                    languages: updated,
                    default_language: '',
                });

                return;
            }
        } else {
            updated = [...data.languages, code];
        }

        setData('languages', updated);
    };

    /**
     * ✅ Set default
     */
    const setDefault = (code: string) => {
        if (!data.languages.includes(code)) {
            toast.error('Language must be enabled first');

            return;
        }

        setData('default_language', code);
    };

    /**
     * ✅ Submit
     */
    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (
            data.default_language &&
            !data.languages.includes(data.default_language)
        ) {
            toast.error('Default language must be active');

            return;
        }

        post('/dashboard/options', {
            preserveScroll: true,
            onStart: () => toast.loading('Saving...', { id: 'save' }),
            onSuccess: () =>
                toast.success('Language settings updated', { id: 'save' }),
            onError: () =>
                toast.error('Failed to save settings', { id: 'save' }),
        });
    };

    if (!initialized) {
        return null;
    }

    return (
        <>
            <Head title="Language Settings" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">Language Settings</h1>
                    <p className="text-muted-foreground">
                        Enable or disable languages and choose a default
                        language.
                    </p>
                </div>

                <hr />

                <form onSubmit={submit} className="space-y-12">
                    {/* SECTION */}
                    <section className="grid grid-cols-3 gap-8">
                        {/* LEFT */}
                        <div>
                            <h3 className="text-lg font-semibold">
                                Website Languages
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Manage available languages from master table.
                            </p>
                        </div>

                        {/* RIGHT */}
                        <div className="col-span-2 space-y-4 rounded-xl bg-card p-6 shadow">
                            {languages.map((lang) => (
                                <LanguageItemRow
                                    key={lang.id}
                                    lang={lang}
                                    isActive={data.languages.includes(
                                        lang.code,
                                    )}
                                    isDefault={
                                        data.default_language === lang.code
                                    }
                                    onToggle={toggleLanguage}
                                    onSetDefault={setDefault}
                                />
                            ))}
                        </div>
                    </section>

                    {/* SUBMIT */}
                    <div className="flex justify-end">
                        <Button disabled={processing}>
                            {processing ? 'Saving...' : 'Update Settings'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

/**
 * ✅ Reusable Row Component (clean & scalable)
 */
function LanguageItemRow({
    lang,
    isActive,
    isDefault,
    onToggle,
    onSetDefault,
}: {
    lang: {
        code: string;
        english_name: string;
        default_locale: string;
    };
    isActive: boolean;
    isDefault: boolean;
    onToggle: (code: string) => void;
    onSetDefault: (code: string) => void;
}) {
    return (
        <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
            <div>
                <p className="font-medium">{lang.english_name}</p>

                <p className="text-xs text-muted-foreground">
                    {lang.code} • {lang.default_locale}
                </p>

                {isDefault && (
                    <p className="text-xs text-blue-600">Default Language</p>
                )}
            </div>

            <div className="flex items-center gap-4">
                {/* Toggle */}
                <Checkbox
                    checked={isActive}
                    onCheckedChange={() => onToggle(lang.code)}
                />

                {/* Default Button */}
                {isActive && (
                    <Button
                        type="button"
                        size="sm"
                        variant={isDefault ? 'secondary' : 'outline'}
                        onClick={() => onSetDefault(lang.code)}
                    >
                        {isDefault ? 'Default' : 'Set Default'}
                    </Button>
                )}
            </div>
        </div>
    );
}

/**
 * ✅ Layout (konsisten semua halaman config)
 */
Language.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan',
            href: '/dashboard/config/main',
        },
        {
            title: 'Language',
            href: '/dashboard/config/language',
        },
    ],
};
