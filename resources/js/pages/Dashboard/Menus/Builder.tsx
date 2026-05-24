import { Head, router, usePage } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import MenuBuilder from '@/components/menu/MenuBuilder';
import { Button } from '@/components/ui/button';

interface Menu {
    id: number;
    name: string;
    slug: string;
}

interface LanguageOption {
    label: string;
    value: string;
}

function normalizeLanguages(languages: Array<string | Record<string, string>>): LanguageOption[] {
    return languages
        .map((language) => {
            if (typeof language === 'string') {
                return { label: language.toUpperCase(), value: language.toLowerCase() };
            }

            const value = language.code || language.locale || language.value || language.name || '';
            const label = language.name || language.label || value.toUpperCase();

            return { label, value: value.toLowerCase() };
        })
        .filter((language) => language.value);
}

export default function Builder({
    menu,
    items,
    languages,
    default_language,
}: {
    menu: Menu;
    items: any[];
    languages: Array<string | Record<string, string>>;
    default_language: string;
}) {
    const { errors } = usePage().props as any;

    const languageOptions = useMemo(() => {
        const normalized = normalizeLanguages(languages || []);

        return normalized.length ? normalized : [{ label: 'ID', value: 'id' }];
    }, [languages]);

    const [tree, setTree] = useState(items || []);
    const [locale, setLocale] = useState(default_language || languageOptions[0].value);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setTree(items || []);
    }, [items]);

    function handleSave() {
        setSaving(true);

        router.put(
            `/dashboard/menus/${menu.id}/builder`,
            { items: tree },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Menu builder berhasil disimpan');
                    router.reload({ only: ['items'] });
                },
                onError: () => {
                    toast.error(errors?.menu || 'Gagal menyimpan menu builder');
                },
                onFinish: () => setSaving(false),
            },
        );
    }

    return (
        <>
            <Head title="Menu Builder" />

            <div className="container mx-auto space-y-6 px-6 py-10">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold">{menu.name}</h1>
                        <p className="text-muted-foreground">
                            Build menu items and translations for each language
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={locale}
                            onChange={(e) => setLocale(e.target.value)}
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                        >
                            {languageOptions.map((language) => (
                                <option key={language.value} value={language.value}>
                                    {language.label}
                                </option>
                            ))}
                        </select>

                        <Button onClick={handleSave} disabled={saving}>
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? 'Saving...' : 'Save Menu'}
                        </Button>
                    </div>
                </div>

                {errors?.menu && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                        {errors.menu}
                    </div>
                )}

                <MenuBuilder tree={tree} setTree={setTree} locale={locale} />
            </div>
        </>
    );
}

Builder.layout = {
    breadcrumbs: [
        { title: 'Menus', href: '/dashboard/menus' },
        { title: 'Builder', href: '#' },
    ],
};
