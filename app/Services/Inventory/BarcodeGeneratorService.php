<?php

namespace App\Services\Inventory;

use App\Models\Shop\ProductStockUnit;
use Illuminate\Support\Facades\DB;
use Picqer\Barcode\BarcodeGenerator;
use Picqer\Barcode\BarcodeGeneratorSVG;

class BarcodeGeneratorService
{
    public function generateStockUnitBarcode(): string
    {
        return DB::transaction(function () {
            return $this->nextBarcodeValue();
        }, 3);
    }

    public function ensureBarcode(ProductStockUnit $stockUnit): ProductStockUnit
    {
        if ($stockUnit->barcode) {
            return $stockUnit;
        }

        return DB::transaction(function () use ($stockUnit) {
            $locked = ProductStockUnit::query()
                ->withTrashed()
                ->lockForUpdate()
                ->findOrFail($stockUnit->id);

            if ($locked->barcode) {
                return $locked;
            }

            $locked->forceFill([
                'barcode' => $this->nextBarcodeValue(),
            ])->saveQuietly();

            return $locked->fresh();
        }, 3);
    }

    public function regenerate(ProductStockUnit $stockUnit): ProductStockUnit
    {
        return DB::transaction(function () use ($stockUnit) {
            $locked = ProductStockUnit::query()
                ->withTrashed()
                ->lockForUpdate()
                ->findOrFail($stockUnit->id);

            $locked->forceFill([
                'barcode' => $this->nextBarcodeValue(),
            ])->saveQuietly();

            return $locked->fresh();
        }, 3);
    }

    /**
     * @param  iterable<ProductStockUnit>  $stockUnits
     * @return array<int, string>
     */
    public function generateBulkStockUnitBarcodes(iterable $stockUnits, bool $forceRegenerate = false): array
    {
        $barcodes = [];

        foreach ($stockUnits as $stockUnit) {
            $updated = $forceRegenerate
                ? $this->regenerate($stockUnit)
                : $this->ensureBarcode($stockUnit);

            $barcodes[] = (string) $updated->barcode;
        }

        return $barcodes;
    }

    public function generateSvg(string $barcode): string
    {
        $generator = new BarcodeGeneratorSVG;

        return $generator->getBarcode(
            $barcode,
            BarcodeGenerator::TYPE_CODE_128,
            1.7,
            42,
        );
    }

    private function nextBarcodeValue(): string
    {
        $prefix = strtoupper((string) config('inventory.barcode_prefix', 'GT'));
        $period = now()->format('Ym');
        $pattern = $prefix.'-'.$period.'-%';

        $lastBarcode = ProductStockUnit::query()
            ->withTrashed()
            ->where('barcode', 'like', $pattern)
            ->orderByDesc('barcode')
            ->lockForUpdate()
            ->value('barcode');

        $lastSequence = $this->extractSequence($lastBarcode, $prefix, $period);
        $sequence = $lastSequence + 1;

        while (true) {
            $candidate = sprintf('%s-%s-%06d', $prefix, $period, $sequence);

            $exists = ProductStockUnit::query()
                ->withTrashed()
                ->where('barcode', $candidate)
                ->exists();

            if (! $exists) {
                return $candidate;
            }

            $sequence++;
        }
    }

    private function extractSequence(?string $barcode, string $prefix, string $period): int
    {
        if (! $barcode) {
            return 0;
        }

        $expectedPrefix = $prefix.'-'.$period.'-';

        if (! str_starts_with($barcode, $expectedPrefix)) {
            return 0;
        }

        $tail = substr($barcode, strlen($expectedPrefix));

        return ctype_digit($tail) ? (int) $tail : 0;
    }
}
