import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import MenuBuilder from '@/components/menu/MenuBuilder';
import { Button } from '@/components/ui/button';

export default function Edit({
    menu,
    items,
    languages,
    default_language,
}: any) {
    const { errors } = usePage().props as any;

    const [tree, setTree] = useState(items || []);
    const [locale, setLocale] = useState(default_language || 'ID');
    const [saving, setSaving] = useState(false);

    // 🔥 hanya set awal (tidak overwrite terus)
    useEffect(() => {
        if (items) {
            setTree(items);
        }
    }, []); // ⛔ kosongin dependency

    function handleSave() {
        setSaving(true);

        router.put(
            `/dashboard/menus/${menu.id}`,
            { items: tree },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Menu updated');

                    router.reload({
                        only: ['items'],
                    });
                },
                onError: () => {
                    toast.error(errors?.menu || 'Failed');
                },
                onFinish: () => setSaving(false),
            },
        );
    }

    return (
        <>
            <Head title="Menu Builder" />

            <div className="space-y-6 p-6">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{menu.name}</h1>

                    <div className="flex items-center gap-3">
                        {/* 🔥 LANGUAGE SWITCHER */}
                        <select
                            value={locale}
                            onChange={(e) => setLocale(e.target.value)}
                            className="rounded border px-3 py-2 text-sm"
                        >
                            {languages.map((lang: any) => (
                                <option key={lang} value={lang}>
                                    {lang}
                                </option>
                            ))}
                        </select>

                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Menu'}
                        </Button>
                    </div>
                </div>

                {/* 🔥 ERROR DISPLAY */}
                {errors?.menu && (
                    <div className="rounded bg-red-100 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
                        {errors.menu}
                    </div>
                )}

                {/* MENU BUILDER */}
                <MenuBuilder tree={tree} setTree={setTree} locale={locale} />
            </div>
        </>
    );
}
