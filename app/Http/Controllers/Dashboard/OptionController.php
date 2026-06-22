<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\OptionRequest;
use App\Models\Dashboard\Option;
use App\Services\Dashboard\OptionService;
use App\Support\ContentEditorMode;
use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class OptionController extends Controller
{
    public function __construct(
        protected OptionService $service
    ) {}

    public function index()
    {
        $props = list_cache()->rememberRequest('options', request(), function () {
            return [
                'options' => $this->service->paginate(),
            ];
        });

        return Inertia::render('Options/Index', $props);
    }

    public function store(Request $request)
    {
        $validationRules = [
            'logo' => 'nullable|image|max:2048',
            'logo_footer' => 'nullable|image|max:2048',
            'logo_mobile' => 'nullable|image|max:2048',
            'favicon_ico' => 'nullable|file|mimes:ico,png,jpg,jpeg,svg,webp|max:2048',
        ];

        if ($request->has('website_mode')) {
            $validationRules['website_mode'] = 'required|in:blog,commerce,simple_blog_commerce';
            $validationRules['enabled_ecommerce_menus'] = 'nullable|array';
            $validationRules['enabled_ecommerce_menus.*'] = 'string|in:products,product-variants,variant-items,brands,categories,units,product-stock-units,orders,customers,carts,payments,stock-movements,shipping,suppliers,incoming-goods,supplier-returns';
        }

        if ($request->has('default_content_editor')) {
            $validationRules['default_content_editor'] = [
                'required',
                'string',
                Rule::in(ContentEditorMode::allowed()),
            ];
        }

        $request->validate($validationRules);

        $data = $request->all();

        if ($request->has('website_mode') && ! $request->has('enabled_ecommerce_menus')) {
            $data['enabled_ecommerce_menus'] = [];
        }

        $logoFields = [
            'favicon_ico',
            'logo',
            'logo_footer',
            'logo_mobile',
        ];

        foreach ($logoFields as $field) {
            $urlField = $field.'_url';

            if ($request->has($urlField)) {
                $path = MediaPath::normalize($request->input($urlField), requireExists: false);
                $oldPath = Option::getByKey($field);

                if ($path !== null) {
                    if ($oldPath && $oldPath !== $path) {
                        if (str_starts_with($oldPath, 'settings/')) {
                            if (Storage::disk('idcloudhost')->exists($oldPath)) {
                                Storage::disk('idcloudhost')->delete($oldPath);
                            } elseif (Storage::disk('public')->exists($oldPath)) {
                                Storage::disk('public')->delete($oldPath);
                            }
                        }
                    }
                    $data[$field] = $path;
                } else {
                    if ($oldPath) {
                        if (str_starts_with($oldPath, 'settings/')) {
                            if (Storage::disk('idcloudhost')->exists($oldPath)) {
                                Storage::disk('idcloudhost')->delete($oldPath);
                            } elseif (Storage::disk('public')->exists($oldPath)) {
                                Storage::disk('public')->delete($oldPath);
                            }
                        }
                    }
                    $data[$field] = null;
                }

                unset($data[$urlField]);

                continue;
            }

            if ($request->hasFile($field)) {
                $file = $request->file($field);
                $oldPath = Option::getByKey($field);

                if ($oldPath) {
                    if (Storage::disk('idcloudhost')->exists($oldPath)) {
                        Storage::disk('idcloudhost')->delete($oldPath);
                    } elseif (Storage::disk('public')->exists($oldPath)) {
                        Storage::disk('public')->delete($oldPath);
                    }
                }

                // beri nama unik
                $filename = time().'_'.$field.'.'.$file->getClientOriginalExtension();

                $path = $file->storeAs('settings', $filename, 'idcloudhost');

                $data[$field] = $path;
            }

            if (empty($data[$field])) {
                $data[$field] = null;
            }
        }

        $this->service->store($data);

        return redirect()->back()
            ->with('success', 'Option created');
    }

    public function update(OptionRequest $request, int $id)
    {
        $this->service->update($id, $request->validated());

        return redirect()->back()
            ->with('success', 'Option updated');
    }

    public function destroy(int $id)
    {
        $this->service->delete($id);

        return redirect()->back()
            ->with('success', 'Option deleted');
    }
}
