<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\BannerSlide\BannerSlideRequest;
use App\Http\Resources\Store\BannerSlideResource;
use App\Models\Shop\BannerSlide;
use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BannerSlideController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $type = trim((string) $request->query('type', ''));
        $position = trim((string) $request->query('position', ''));
        $isActive = $this->parseNullableBoolean($request->query('is_active'));

        $slides = BannerSlide::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($builder) use ($search) {
                    $builder->where('title', 'like', "%{$search}%")
                        ->orWhere('subtitle', 'like', "%{$search}%");
                });
            })
            ->type($type !== '' ? $type : null)
            ->position($position !== '' ? $position : null)
            ->when($isActive !== null, fn ($query) => $query->where('is_active', $isActive))
            ->orderBy('sort_order')
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (BannerSlide $slide) => BannerSlideResource::make($slide)->resolve());

        return Inertia::render('Dashboard/Store/BannerSlide/Index', [
            'slides' => $slides,
            'typeOptions' => $this->typeOptions(),
            'positionOptions' => $this->positionOptions(),
            'filters' => [
                'search' => $search,
                'type' => $type,
                'position' => $position,
                'is_active' => $isActive,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Dashboard/Store/BannerSlide/Create', [
            'typeOptions' => $this->typeOptions(),
            'positionOptions' => $this->positionOptions(),
        ]);
    }

    public function store(BannerSlideRequest $request)
    {
        $data = Arr::except($request->validated(), ['image', 'mobile_image']);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('banner_slides', 'public');
        } elseif ($mediaPath = MediaPath::normalize($request->input('image'))) {
            $data['image'] = $mediaPath;
        }

        if ($request->hasFile('mobile_image')) {
            $data['mobile_image'] = $request->file('mobile_image')->store('banner_slides/mobile', 'public');
        } elseif ($mediaPath = MediaPath::normalize($request->input('mobile_image'))) {
            $data['mobile_image'] = $mediaPath;
        }

        BannerSlide::create($data);

        return redirect()->route('banner-slides.index')
            ->with('success', 'Banner slide created successfully.');
    }

    public function edit(BannerSlide $bannerSlide): Response
    {
        return Inertia::render('Dashboard/Store/BannerSlide/Edit', [
            'slide' => BannerSlideResource::make($bannerSlide)->resolve(),
            'typeOptions' => $this->typeOptions(),
            'positionOptions' => $this->positionOptions(),
        ]);
    }

    public function update(BannerSlideRequest $request, BannerSlide $bannerSlide)
    {
        $data = Arr::except($request->validated(), ['image', 'mobile_image']);

        if ($request->hasFile('image')) {
            if ($bannerSlide->image) {
                Storage::disk('public')->delete($bannerSlide->image);
            }

            $data['image'] = $request->file('image')->store('banner_slides', 'public');
        } elseif ($request->filled('image')) {
            $data['image'] = MediaPath::normalize($request->input('image')) ?? $bannerSlide->image;
        }

        if ($request->hasFile('mobile_image')) {
            if ($bannerSlide->mobile_image) {
                Storage::disk('public')->delete($bannerSlide->mobile_image);
            }

            $data['mobile_image'] = $request->file('mobile_image')->store('banner_slides/mobile', 'public');
        } elseif ($request->has('mobile_image') && $request->input('mobile_image') === '') {
            $data['mobile_image'] = null;
        } elseif ($request->filled('mobile_image')) {
            $data['mobile_image'] = MediaPath::normalize($request->input('mobile_image')) ?? $bannerSlide->mobile_image;
        }

        $bannerSlide->update($data);

        return redirect()->route('banner-slides.index')
            ->with('success', 'Banner slide updated successfully.');
    }

    public function destroy(BannerSlide $bannerSlide)
    {
        $bannerSlide->delete();

        return redirect()->route('banner-slides.index')
            ->with('success', 'Banner slide deleted successfully.');
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
            ['value' => 'homepage', 'label' => 'Homepage'],
            ['value' => 'promo', 'label' => 'Promo'],
        ];
    }

    private function positionOptions(): array
    {
        return [
            ['value' => 'main', 'label' => 'Main'],
            ['value' => 'secondary', 'label' => 'Secondary'],
        ];
    }
}
