<?php

namespace Database\Seeders;

use App\Models\Dashboard\Kabupaten;
use App\Models\Dashboard\Kecamatan;
use App\Models\Dashboard\Kelurahan;
use App\Models\Dashboard\Province;
use Illuminate\Database\Seeder;

class IndonesiaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $path = __DIR__.'/csv/provinces.csv';

        foreach (array_slice(glob($path), 0, 2) as $file) {

            // read the data into an array
            $data = array_map('str_getcsv', file($file));

            // loop over the data
            foreach ($data as $key => $row) {
                $m = new Province;
                $m->id = $row[0];
                $m->name = $row[1];
                $m->save();
            }
        }

        $path = __DIR__.'/csv/regencies.csv';

        foreach (array_slice(glob($path), 0, 2) as $file) {

            // read the data into an array
            $data = array_map('str_getcsv', file($file));

            // loop over the data
            foreach ($data as $key => $row) {
                $m = new Kabupaten;
                $m->id = $row[0];
                $m->province_id = $row[1];
                $m->name = $row[2];
                $m->save();
            }
        }

        $path = __DIR__.'/csv/districts.csv';

        foreach (array_slice(glob($path), 0, 2) as $file) {

            // read the data into an array
            $data = array_map('str_getcsv', file($file));

            // loop over the data
            foreach ($data as $key => $row) {
                $m = new Kecamatan;
                $m->id = $row[0];
                $m->kabupaten_id = $row[1];
                $m->name = $row[2];
                $m->save();
            }
        }

        $path = __DIR__.'/csv/villages.csv';

        foreach (array_slice(glob($path), 0, 2) as $file) {

            // read the data into an array
            $data = array_map('str_getcsv', file($file));

            // loop over the data
            foreach ($data as $key => $row) {
                $cek = Kelurahan::where('id', $row['0'])->first();
                if ($cek) {
                    $m = Kelurahan::find($cek->id);
                } else {
                    $m = new Kelurahan;
                }

                $m->id = $row[0];
                $m->kecamatan_id = $row[1];
                $m->name = $row[2];
                $m->save();
            }
        }

        // update lat and lg
        $path = __DIR__.'/csv/lat_lng.csv';

        foreach (array_slice(glob($path), 0, 2) as $file) {

            // read the data into an array
            $data = array_map('str_getcsv', file($file));

            // loop over the data
            foreach ($data as $key => $row) {
                // province
                Province::where('id', $row[3])
                    ->update(
                        [
                            'lat' => $row[5],
                            'lng' => $row[6],
                        ]
                    );

                Kabupaten::where('id', $row[3])
                    ->update(
                        [
                            'lat' => $row[5],
                            'lng' => $row[6],
                        ]
                    );

                Kecamatan::where('id', $row[3])
                    ->update(
                        [
                            'lat' => $row[5],
                            'lng' => $row[6],
                        ]
                    );

                Kelurahan::where('id', $row[3])
                    ->update(
                        [
                            'lat' => $row[5],
                            'lng' => $row[6],
                        ]
                    );
            }
        }
    }
}
