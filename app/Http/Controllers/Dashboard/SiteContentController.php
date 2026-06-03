<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\SiteContent\SiteContentRequest;
use App\Http\Resources\Store\SiteContentResource;
use App\Models\Shop\SiteContent;
use App\Models\Shop\SiteContentTranslation;
use App\Services\ActiveLanguageService;
use App\Services\Api\V1\SiteContentApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SiteContentController extends Controller
{
    public function __construct(
        private readonly ActiveLanguageService $activeLanguageService,
        private readonly SiteContentApiService $siteContentApiService,
    ) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $group = trim((string) $request->query('group', ''));
        $type = trim((string) $request->query('type', ''));
        $isActive = $this->parseNullableBoolean($request->query('is_active'));

        $siteContents = SiteContent::query()
            ->with('translations')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($builder) use ($search) {
                    $builder->where('key', 'like', "%{$search}%")
                        ->orWhere('group', 'like', "%{$search}%")
                        ->orWhere('type', 'like', "%{$search}%")
                        ->orWhereHas('translations', function ($translationQuery) use ($search) {
                            $translationQuery->where('value', 'like', "%{$search}%");
                        });
                });
            })
            ->group($group !== '' ? $group : null)
            ->type($type !== '' ? $type : null)
            ->when($isActive !== null, fn ($query) => $query->where('is_active', $isActive))
            ->orderBy('group')
            ->orderBy('sort_order')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (SiteContent $content) => SiteContentResource::make($content)->resolve());

        return Inertia::render('Dashboard/Config/SiteContent/Index', [
            'siteContents' => $siteContents,
            'activeLanguages' => $this->activeLanguages(),
            'groupOptions' => $this->groupOptions(),
            'typeOptions' => $this->typeOptions(),
            'filters' => [
                'search' => $search,
                'group' => $group,
                'type' => $type,
                'is_active' => $isActive,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Dashboard/Config/SiteContent/Create', [
            'activeLanguages' => $this->activeLanguages(),
            'groupOptions' => $this->groupOptions(),
            'typeOptions' => $this->typeOptions(),
        ]);
    }

    public function usage(): Response
    {
        return Inertia::render('Dashboard/Config/SiteContent/Usage', [
            'apiBaseUrl' => url('/api'),
        ]);
    }

    public function store(SiteContentRequest $request)
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated) {
            $siteContent = SiteContent::create(Arr::except($validated, ['translations']));

            $this->upsertTranslations($siteContent, $validated['translations'] ?? []);
        });

        $this->siteContentApiService->flushCache();

        return redirect()->route('config.site-contents.index')
            ->with('success', 'Site content created successfully.');
    }

    public function edit(SiteContent $siteContent): Response
    {
        $siteContent->load('translations');

        return Inertia::render('Dashboard/Config/SiteContent/Edit', [
            'siteContent' => SiteContentResource::make($siteContent)->resolve(),
            'activeLanguages' => $this->activeLanguages(),
            'groupOptions' => $this->groupOptions(),
            'typeOptions' => $this->typeOptions(),
        ]);
    }

    public function update(SiteContentRequest $request, SiteContent $siteContent)
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $siteContent) {
            $siteContent->update(Arr::except($validated, ['translations']));

            $this->upsertTranslations($siteContent, $validated['translations'] ?? []);
        });

        $this->siteContentApiService->flushCache();

        return redirect()->route('config.site-contents.index')
            ->with('success', 'Site content updated successfully.');
    }

    public function destroy(SiteContent $siteContent)
    {
        $siteContent->delete();

        $this->siteContentApiService->flushCache();

        return redirect()->route('config.site-contents.index')
            ->with('success', 'Site content deleted successfully.');
    }

    /**
     * @param  array<int, array{locale:string, value:mixed}>  $translations
     */
    private function upsertTranslations(SiteContent $siteContent, array $translations): void
    {
        $translationsByLocale = collect($translations)
            ->filter(fn ($translation) => is_array($translation) && ! empty($translation['locale']))
            ->mapWithKeys(fn (array $translation) => [
                strtolower((string) $translation['locale']) => $translation['value'] ?? null,
            ]);

        foreach ($this->activeLanguageService->activeCodes() as $locale) {
            SiteContentTranslation::updateOrCreate(
                [
                    'site_content_id' => $siteContent->id,
                    'locale' => $locale,
                ],
                [
                    'value' => $translationsByLocale->get($locale),
                ],
            );
        }
    }

    private function parseNullableBoolean(mixed $value): ?bool
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_bool($value)) {
            return $value;
        }

        if (in_array($value, ['1', 1, 'true', 'on'], true)) {
            return true;
        }

        if (in_array($value, ['0', 0, 'false', 'off'], true)) {
            return false;
        }

        return null;
    }

    private function activeLanguages(): array
    {
        return $this->activeLanguageService
            ->activeLanguages()
            ->map(fn ($language) => [
                'code' => strtolower((string) $language->code),
                'name' => $language->english_name,
                'default_locale' => $language->default_locale,
            ])
            ->values()
            ->all();
    }

    private function groupOptions(): array
    {
        return [
            ['value' => 'homepage', 'label' => 'Homepage'],
            ['value' => 'footer', 'label' => 'Footer'],
            ['value' => 'product_detail', 'label' => 'Product Detail'],
            ['value' => 'checkout', 'label' => 'Checkout'],
            ['value' => 'promo', 'label' => 'Promo'],
            ['value' => 'general', 'label' => 'General'],
        ];
    }

    private function typeOptions(): array
    {
        return [
            ['value' => 'text', 'label' => 'Text'],
            ['value' => 'textarea', 'label' => 'Textarea'],
            ['value' => 'richtext', 'label' => 'Rich Text'],
            ['value' => 'url', 'label' => 'URL'],
            ['value' => 'image', 'label' => 'Image'],
        ];
    }
}
