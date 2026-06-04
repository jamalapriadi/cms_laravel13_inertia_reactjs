<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\Faq\FaqRequest;
use App\Http\Resources\Store\FaqResource;
use App\Models\Shop\Faq;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FaqController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $type = trim((string) $request->query('type', ''));
        $position = trim((string) $request->query('position', ''));
        $isActive = $this->parseNullableBoolean($request->query('is_active'));
        $showHome = $this->parseNullableBoolean($request->query('show_home'));

        $props = list_cache()->rememberRequest('faqs', $request, function () use ($search, $type, $position, $isActive, $showHome) {
            $faqs = Faq::query()
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($builder) use ($search) {
                        $builder->where('question', 'like', "%{$search}%")
                            ->orWhere('answer', 'like', "%{$search}%");
                    });
                })
                ->type($type !== '' ? $type : null)
                ->position($position !== '' ? $position : null)
                ->when($isActive !== null, fn ($query) => $query->where('is_active', $isActive))
                ->when($showHome !== null, fn ($query) => $query->where('show_home', $showHome))
                ->orderBy('sort_order')
                ->latest()
                ->paginate(10)
                ->withQueryString()
                ->through(fn (Faq $faq) => FaqResource::make($faq)->resolve());

            return [
                'faqs' => $faqs,
                'typeOptions' => $this->typeOptions(),
                'positionOptions' => $this->positionOptions(),
                'filters' => [
                    'search' => $search,
                    'type' => $type,
                    'position' => $position,
                    'is_active' => $isActive,
                    'show_home' => $showHome,
                ],
            ];
        });

        return Inertia::render('Dashboard/Store/Faq/Index', $props);
    }

    public function create(): Response
    {
        return Inertia::render('Dashboard/Store/Faq/Create', [
            'typeOptions' => $this->typeOptions(),
            'positionOptions' => $this->positionOptions(),
        ]);
    }

    public function store(FaqRequest $request)
    {
        Faq::create($request->validated());

        return redirect()->route('faqs.index')
            ->with('success', 'FAQ created successfully.');
    }

    public function edit(Faq $faq): Response
    {
        return Inertia::render('Dashboard/Store/Faq/Edit', [
            'faq' => FaqResource::make($faq)->resolve(),
            'typeOptions' => $this->typeOptions(),
            'positionOptions' => $this->positionOptions(),
        ]);
    }

    public function update(FaqRequest $request, Faq $faq)
    {
        $faq->update($request->validated());

        return redirect()->route('faqs.index')
            ->with('success', 'FAQ updated successfully.');
    }

    public function destroy(Faq $faq)
    {
        $faq->delete();

        return redirect()->route('faqs.index')
            ->with('success', 'FAQ deleted successfully.');
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

    private function typeOptions(): array
    {
        return [
            ['value' => 'general', 'label' => 'General'],
            ['value' => 'product', 'label' => 'Product'],
            ['value' => 'checkout', 'label' => 'Checkout'],
            ['value' => 'shipping', 'label' => 'Shipping'],
            ['value' => 'payment', 'label' => 'Payment'],
            ['value' => 'promo', 'label' => 'Promo'],
        ];
    }

    private function positionOptions(): array
    {
        return [
            ['value' => 'homepage', 'label' => 'Homepage'],
            ['value' => 'product_detail', 'label' => 'Product Detail'],
            ['value' => 'checkout', 'label' => 'Checkout'],
            ['value' => 'shipping', 'label' => 'Shipping'],
            ['value' => 'payment', 'label' => 'Payment'],
            ['value' => 'promo', 'label' => 'Promo'],
            ['value' => 'footer', 'label' => 'Footer'],
        ];
    }
}
