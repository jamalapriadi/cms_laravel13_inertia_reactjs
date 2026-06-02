import { Head } from '@inertiajs/react';

interface Props {
    apiBaseUrl: string;
}

export default function Usage({ apiBaseUrl }: Props) {
    return (
        <>
            <Head title="Site Contents Usage" />

            <div className="container mx-auto max-w-5xl space-y-8 px-6 py-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Cara Penggunaan Site Contents</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Panduan integrasi content key-value multi-language untuk frontend Inertia dan Next.js.
                    </p>
                </div>

                <section className="space-y-3 rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold">1. Ambil Content Berdasarkan Group</h2>
                    <p className="text-sm text-muted-foreground">
                        Gunakan service <code>SiteContentService</code> di controller Laravel:
                    </p>
                    <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
{`$contents = app(\\App\\Services\\SiteContentService::class)
    ->getGroup('homepage', $locale, $fallbackLocale);`}
                    </pre>
                </section>

                <section className="space-y-3 rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold">2. API untuk Frontend Next.js</h2>
                    <p className="text-sm text-muted-foreground">
                        Rekomendasi endpoint:
                    </p>
                    <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
{`GET ${apiBaseUrl}/site-contents/group/{group}?locale=id
GET ${apiBaseUrl}/site-contents/keys?locale=id`}
                    </pre>
                    <p className="text-sm text-muted-foreground">
                        Contoh request di Next.js:
                    </p>
                    <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
{`const res = await fetch(
  \`${apiBaseUrl}/site-contents/group/homepage?locale=id\`
);
const json = await res.json();
const contents = json.data;`}
                    </pre>
                </section>

                <section className="space-y-3 rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold">3. Cara Pakai di React/TSX</h2>
                    <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
{`<h1>{contents['homepage.hero.title'] ?? 'Fallback Title'}</h1>
<p>{contents['homepage.hero.subtitle'] ?? 'Fallback Subtitle'}</p>`}
                    </pre>
                    <p className="text-sm text-muted-foreground">
                        Selalu pakai fallback supaya tampilan tidak kosong jika translation belum diisi.
                    </p>
                </section>
            </div>
        </>
    );
}

Usage.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan',
            href: '/dashboard/config/main',
        },
        {
            title: 'Site Contents',
            href: '/dashboard/config/site-contents',
        },
        {
            title: 'Cara Penggunaan',
            href: '/dashboard/config/site-contents/usage',
        },
    ],
};
