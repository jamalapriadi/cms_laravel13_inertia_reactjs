<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $this->prepareProductVariantsTable();
        $this->createProductVariantOptionsTable();
        $this->createVariantItemsTable();
        $this->createVariantItemOptionsTable();
        $this->copyExistingSkuVariants();
        $this->pointLegacyVariantForeignKeysToVariantItems();
    }

    public function down(): void
    {
        //
    }

    private function prepareProductVariantsTable(): void
    {
        if (! Schema::hasTable('product_variants')) {
            return;
        }

        Schema::table('product_variants', function (Blueprint $table) {
            if (! Schema::hasColumn('product_variants', 'sort_order')) {
                $table->integer('sort_order')->default(0)->after('name');
            }
        });

        if (DB::getDriverName() === 'mysql' && Schema::hasColumn('product_variants', 'sku')) {
            DB::statement('ALTER TABLE product_variants MODIFY sku VARCHAR(255) NULL');
        }
    }

    private function createProductVariantOptionsTable(): void
    {
        if (Schema::hasTable('product_variant_options')) {
            return;
        }

        Schema::create('product_variant_options', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_variant_id');
            $table->string('value');
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('product_variant_id')
                ->references('id')
                ->on('product_variants')
                ->cascadeOnDelete();

            $table->index('product_variant_id');
            $table->unique(['product_variant_id', 'value']);
        });
    }

    private function createVariantItemsTable(): void
    {
        if (Schema::hasTable('variant_items')) {
            return;
        }

        Schema::create('variant_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_id');
            $table->ulid('unit_id')->nullable();
            $table->string('sku')->unique();
            $table->string('name');
            $table->string('image')->nullable();
            $table->decimal('buying_price', 15, 2)->default(0);
            $table->decimal('selling_price', 15, 2)->default(0);
            $table->boolean('track_stock')->default(true);
            $table->integer('stock')->default(0);
            $table->integer('min_stock_alert')->nullable();
            $table->decimal('weight', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->cascadeOnDelete();

            $table->foreign('unit_id')
                ->references('id')
                ->on('units')
                ->nullOnDelete();

            $table->index('product_id');
            $table->index('unit_id');
            $table->index('sku');
            $table->index('is_active');
        });
    }

    private function createVariantItemOptionsTable(): void
    {
        if (Schema::hasTable('variant_item_options')) {
            return;
        }

        Schema::create('variant_item_options', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('variant_item_id');
            $table->uuid('product_variant_option_id');
            $table->timestamps();

            $table->foreign('variant_item_id')
                ->references('id')
                ->on('variant_items')
                ->cascadeOnDelete();

            $table->foreign('product_variant_option_id')
                ->references('id')
                ->on('product_variant_options')
                ->cascadeOnDelete();

            $table->unique(['variant_item_id', 'product_variant_option_id'], 'vio_item_option_unique');
            $table->index('variant_item_id');
            $table->index('product_variant_option_id');
        });
    }

    private function copyExistingSkuVariants(): void
    {
        if (! Schema::hasTable('product_variants') || ! Schema::hasColumn('product_variants', 'sku')) {
            return;
        }

        $columns = collect([
            'id',
            'product_id',
            'unit_id',
            'name',
            'color',
            'storage',
            'sku',
            'image',
            'price',
            'track_stock',
            'stock',
            'min_stock_alert',
            'weight',
            'cost_price',
            'is_active',
            'created_at',
            'updated_at',
            'deleted_at',
        ])->filter(fn (string $column) => Schema::hasColumn('product_variants', $column))->all();

        $copiedIds = [];

        DB::table('product_variants')
            ->select($columns)
            ->whereNotNull('sku')
            ->orderBy('id')
            ->chunk(100, function ($variants) use (&$copiedIds) {
                foreach ($variants as $variant) {
                    if (DB::table('variant_items')->where('id', $variant->id)->exists()) {
                        $copiedIds[] = $variant->id;

                        continue;
                    }

                    DB::table('variant_items')->insert([
                        'id' => $variant->id,
                        'product_id' => $variant->product_id,
                        'unit_id' => $variant->unit_id ?? null,
                        'sku' => $variant->sku,
                        'name' => $variant->name,
                        'image' => $variant->image ?? null,
                        'buying_price' => $variant->cost_price ?? 0,
                        'selling_price' => $variant->price ?? 0,
                        'track_stock' => $variant->track_stock ?? true,
                        'stock' => $variant->stock ?? 0,
                        'min_stock_alert' => $variant->min_stock_alert ?? null,
                        'weight' => $variant->weight ?? null,
                        'is_active' => $variant->is_active ?? true,
                        'created_at' => $variant->created_at ?? now(),
                        'updated_at' => $variant->updated_at ?? now(),
                        'deleted_at' => $variant->deleted_at ?? null,
                    ]);

                    $copiedIds[] = $variant->id;

                    $optionIds = collect([
                        ['name' => 'Warna', 'value' => $variant->color ?? null, 'sort' => 0],
                        ['name' => 'Storage', 'value' => $variant->storage ?? null, 'sort' => 1],
                    ])
                        ->filter(fn (array $option) => filled($option['value']))
                        ->map(fn (array $option) => $this->variantOptionId(
                            $variant->product_id,
                            $option['name'],
                            $option['value'],
                            $option['sort'],
                        ))
                        ->filter()
                        ->values();

                    foreach ($optionIds as $optionId) {
                        $exists = DB::table('variant_item_options')->where([
                            'variant_item_id' => $variant->id,
                            'product_variant_option_id' => $optionId,
                        ])->exists();

                        if (! $exists) {
                            DB::table('variant_item_options')->insert([
                                'id' => (string) Str::uuid(),
                                'variant_item_id' => $variant->id,
                                'product_variant_option_id' => $optionId,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }
            });

        if ($copiedIds !== [] && Schema::hasColumn('product_variants', 'deleted_at')) {
            DB::table('product_variants')
                ->whereIn('id', $copiedIds)
                ->whereNull('deleted_at')
                ->update(['deleted_at' => now(), 'updated_at' => now()]);
        }
    }

    private function variantOptionId(string $productId, string $variantName, string $value, int $sortOrder): ?string
    {
        $variant = DB::table('product_variants')
            ->where('product_id', $productId)
            ->where('name', $variantName)
            ->when(Schema::hasColumn('product_variants', 'sku'), fn ($query) => $query->whereNull('sku'))
            ->whereNull('deleted_at')
            ->first();

        if (! $variant) {
            $variantId = (string) Str::uuid();

            DB::table('product_variants')->insert([
                'id' => $variantId,
                'product_id' => $productId,
                'name' => $variantName,
                'sku' => null,
                'sort_order' => $sortOrder,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $variantId = $variant->id;
        }

        $option = DB::table('product_variant_options')
            ->where('product_variant_id', $variantId)
            ->where('value', $value)
            ->first();

        if ($option) {
            return $option->id;
        }

        $optionId = (string) Str::uuid();

        DB::table('product_variant_options')->insert([
            'id' => $optionId,
            'product_variant_id' => $variantId,
            'value' => $value,
            'sort_order' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $optionId;
    }

    private function pointLegacyVariantForeignKeysToVariantItems(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        collect([
            ['product_stock_units', 'product_variant_id', 'cascade'],
            ['stock_movements', 'product_variant_id', 'cascade'],
            ['incoming_goods_items', 'product_variant_id', 'cascade'],
            ['order_items', 'product_variant_id', 'null'],
            ['cart_items', 'product_variant_id', 'null'],
        ])->each(function (array $foreignKey) {
            [$table, $column, $onDelete] = $foreignKey;

            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $column)) {
                return;
            }

            $this->dropForeignKeys($table, $column);

            Schema::table($table, function (Blueprint $blueprint) use ($column, $onDelete) {
                $foreign = $blueprint->foreign($column)
                    ->references('id')
                    ->on('variant_items');

                if ($onDelete === 'null') {
                    $foreign->nullOnDelete();
                } else {
                    $foreign->cascadeOnDelete();
                }
            });
        });
    }

    private function dropForeignKeys(string $table, string $column): void
    {
        $constraints = DB::select(
            'select constraint_name from information_schema.key_column_usage where table_schema = database() and table_name = ? and column_name = ? and referenced_table_name is not null',
            [$table, $column],
        );

        foreach ($constraints as $constraint) {
            $constraintName = $constraint->constraint_name ?? $constraint->CONSTRAINT_NAME;

            DB::statement(sprintf(
                'ALTER TABLE `%s` DROP FOREIGN KEY `%s`',
                str_replace('`', '``', $table),
                str_replace('`', '``', $constraintName),
            ));
        }
    }
};
