<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;

use App\Services\Dashboard\OptionService;
use App\Http\Requests\OptionRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OptionController extends Controller
{
    public function __construct(
        protected OptionService $service
    ) {}

    public function index()
    {
        return Inertia::render('Options/Index', [
            'options' => $this->service->paginate(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->all();

        $logoFields = [
            'favicon_ico',
            'logo',
            'logo_footer',
            'logo_mobile'
        ];

        foreach ($logoFields as $field) {

            if ($request->hasFile($field)) {

                $file = $request->file($field);

                // beri nama unik
                $filename = time().'_'.$field.'.'.$file->getClientOriginalExtension();

                $path = $file->storeAs('settings', $filename, 'public');

                $data[$field] = $path;
            }
            
            // Hapus file field jika kosong (frontend sudah upload via media endpoint)
            if (empty($data[$field])) {
                unset($data[$field]);
            }
            
            // Simpan URL field jika ada
            $urlField = $field . '_url';
            if (isset($data[$urlField]) && !empty($data[$urlField])) {
                // URL sudah valid dari media upload, simpan dengan key tanpa _url suffix
                // untuk konsistensi dengan nama di database
                $data[$field] = $data[$urlField];
                unset($data[$urlField]); // hapus yg _url
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