<?php

namespace Database\Seeders;

use App\Models\Block;
use App\Models\BlockTranslation;
use App\Models\Dashboard\Language;
use App\Models\Post;
use App\Models\PostCategory;
use App\Models\PostTranslation;
use App\Models\Term;
use App\Models\TermTaxonomy;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PostSampleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function (): void {
            $author = $this->author();
            $language = $this->indonesianLanguage();
            $categories = $this->categories();

            foreach ($this->posts() as $index => $payload) {
                $publishedAt = CarbonImmutable::parse('2026-06-02 09:00:00')->subDays($index);
                $slug = Str::slug($payload['title']);
                $blocks = $this->blocksFor($payload);

                $post = Post::query()->updateOrCreate(
                    ['slug' => $slug],
                    [
                        'user_id' => $author->id,
                        'title' => $payload['title'],
                        'content' => json_encode($this->contentBlocks($blocks)),
                        'type' => 'post',
                        'status' => 'publish',
                        'comment_status' => true,
                        'published_at' => $publishedAt,
                    ]
                );

                $categorySlugs = $payload['categories'];
                $primaryCategory = $categories[$categorySlugs[0]];

                $this->syncPostMeta($post, 'post_category_id', $primaryCategory['post_category']->id);
                $this->syncPostMeta($post, 'featured_image', $payload['thumbnail']);
                $this->syncPostMeta($post, 'meta_title', $payload['title'].' | Gita Trading Store');
                $this->syncPostMeta($post, 'meta_description', $payload['excerpt']);

                $post->taxonomies()->syncWithoutDetaching(
                    collect($categorySlugs)
                        ->map(fn (string $categorySlug) => $categories[$categorySlug]['taxonomy']->id)
                        ->all()
                );

                PostTranslation::query()->updateOrCreate(
                    [
                        'post_id' => $post->id,
                        'language_id' => $language->id,
                    ],
                    [
                        'title' => $payload['title'],
                        'slug' => $slug,
                        'content' => json_encode($this->contentBlocks($blocks)),
                        'status' => 'publish',
                        'published_at' => $publishedAt,
                    ]
                );

                foreach ($blocks as $order => $blockPayload) {
                    $block = Block::query()->updateOrCreate(
                        [
                            'post_id' => $post->id,
                            'parent_id' => null,
                            'type' => $blockPayload['type'],
                            'order' => $order,
                        ],
                        [
                            'props' => $blockPayload['props'],
                            'styles' => $blockPayload['styles'] ?? [],
                        ]
                    );

                    BlockTranslation::query()->updateOrCreate(
                        [
                            'block_id' => $block->id,
                            'language_id' => $language->id,
                        ],
                        [
                            'props' => $blockPayload['props'],
                        ]
                    );
                }
            }

            $this->refreshCategoryCounts($categories);
        });
    }

    private function author(): User
    {
        $existingUser = User::query()->first();

        if ($existingUser) {
            return $existingUser;
        }

        return User::query()->create([
            'name' => 'Gita Trading Editor',
            'email' => 'editor@gitatrading-store.com',
            'password' => 'password',
            'email_verified_at' => now(),
        ]);
    }

    private function indonesianLanguage(): Language
    {
        return Language::query()->updateOrCreate(
            ['code' => 'id'],
            [
                'english_name' => 'Indonesian',
                'major' => 1,
                'active' => 1,
                'default_locale' => 'id_ID',
                'tag' => 'id-ID',
                'encode_url' => 0,
                'country' => 'Indonesia',
            ]
        );
    }

    /**
     * @return array<string, array{post_category: PostCategory, taxonomy: TermTaxonomy}>
     */
    private function categories(): array
    {
        return collect([
            'gadget' => 'Gadget',
            'phone' => 'Phone',
            'laptop' => 'Laptop',
        ])->mapWithKeys(function (string $name, string $slug): array {
            $postCategory = PostCategory::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'category_name' => $name,
                    'description' => "Sample {$name} articles for Gita Trading Store.",
                ]
            );

            $term = Term::query()->firstOrCreate(
                ['slug' => $slug],
                ['name' => $name]
            );

            $taxonomy = TermTaxonomy::query()->firstOrCreate(
                [
                    'term_id' => $term->id,
                    'taxonomy' => 'categories',
                ],
                ['description' => "Sample {$name} category."]
            );

            return [
                $slug => [
                    'post_category' => $postCategory,
                    'taxonomy' => $taxonomy,
                ],
            ];
        })->all();
    }

    private function syncPostMeta(Post $post, string $key, string $value): void
    {
        $post->metas()->updateOrCreate(
            ['meta_key' => $key],
            ['meta_value' => $value]
        );
    }

    /**
     * @param  array<string, array{post_category: PostCategory, taxonomy: TermTaxonomy}>  $categories
     */
    private function refreshCategoryCounts(array $categories): void
    {
        collect($categories)
            ->pluck('taxonomy')
            ->each(function (TermTaxonomy $taxonomy): void {
                $taxonomy->update([
                    'count' => DB::table('term_relationships')
                        ->where('term_taxonomy_id', $taxonomy->id)
                        ->count(),
                ]);
            });
    }

    /**
     * @return list<array{title: string, excerpt: string, categories: list<string>, thumbnail: string}>
     */
    private function posts(): array
    {
        return [
            [
                'title' => 'Tips Memilih Gadget Bekas Berkualitas',
                'excerpt' => 'Panduan singkat memilih gadget second yang kondisinya jelas, aman, dan sesuai kebutuhan.',
                'categories' => ['gadget'],
                'thumbnail' => 'https://gitatrading-store.com/img/sample/posts/gadget-bekas-berkualitas.jpg',
            ],
            [
                'title' => 'Perbedaan iPhone Ex Inter dan iBox',
                'excerpt' => 'Kenali perbedaan garansi, kelengkapan, dan risiko sebelum membeli iPhone second.',
                'categories' => ['phone'],
                'thumbnail' => 'https://gitatrading-store.com/img/sample/posts/iphone-ex-inter-ibox.jpg',
            ],
            [
                'title' => 'Rekomendasi HP Second untuk Pelajar',
                'excerpt' => 'Pilihan HP second yang masih nyaman untuk belajar, komunikasi, dan hiburan ringan.',
                'categories' => ['phone'],
                'thumbnail' => 'https://gitatrading-store.com/img/sample/posts/hp-second-pelajar.jpg',
            ],
            [
                'title' => 'Panduan Membeli Laptop Bekas untuk Kerja',
                'excerpt' => 'Checklist praktis memilih laptop bekas untuk kerja harian, meeting, dan produktivitas.',
                'categories' => ['laptop'],
                'thumbnail' => 'https://gitatrading-store.com/img/sample/posts/laptop-bekas-kerja.jpg',
            ],
            [
                'title' => 'MacBook Second Masih Layak Dibeli?',
                'excerpt' => 'Hal penting yang perlu dicek sebelum membeli MacBook second untuk kerja atau kuliah.',
                'categories' => ['laptop'],
                'thumbnail' => 'https://gitatrading-store.com/img/sample/posts/macbook-second.jpg',
            ],
            [
                'title' => 'Cara Mengecek Kondisi Baterai Sebelum Membeli Device Second',
                'excerpt' => 'Baterai adalah komponen penting pada device second. Ini cara membaca kondisinya.',
                'categories' => ['gadget', 'phone', 'laptop'],
                'thumbnail' => 'https://gitatrading-store.com/img/sample/posts/cek-baterai-device-second.jpg',
            ],
        ];
    }

    /**
     * @param  array{title: string, excerpt: string, categories: list<string>, thumbnail: string}  $post
     * @return list<array{type: string, props: array<string, mixed>, styles?: array<string, mixed>}>
     */
    private function blocksFor(array $post): array
    {
        return [
            [
                'type' => 'heading',
                'props' => [
                    'text' => $post['title'],
                    'level' => 'h1',
                ],
            ],
            [
                'type' => 'paragraph',
                'props' => [
                    'text' => $post['excerpt'].' Membeli gadget second bisa menjadi pilihan hemat jika kondisi produk, garansi, dan kelengkapannya dicek dengan teliti.',
                ],
            ],
            [
                'type' => 'image',
                'props' => [
                    'url' => $post['thumbnail'],
                    'alt' => $post['title'],
                    'caption' => 'Ilustrasi produk second berkualitas dari Gita Trading Store.',
                ],
            ],
            [
                'type' => 'list',
                'props' => [
                    'items' => [
                        'Cek kondisi layar dan body secara detail.',
                        'Periksa battery health, charger, dan kelengkapan unit.',
                        'Pastikan IMEI atau serial number sesuai.',
                        'Tanyakan garansi toko dan riwayat pemakaian.',
                    ],
                ],
            ],
            [
                'type' => 'quote',
                'props' => [
                    'text' => 'Produk second yang baik bukan hanya murah, tetapi jelas kondisi dan garansinya.',
                    'author' => 'Gita Trading Store',
                ],
            ],
            [
                'type' => 'cta',
                'props' => [
                    'title' => 'Lihat koleksi produk Gita Trading Store',
                    'description' => 'Temukan gadget, phone, dan laptop second yang sudah dicek kondisinya.',
                    'button_text' => 'Lihat Produk',
                    'button_url' => 'https://gitatrading-store.com',
                ],
            ],
        ];
    }

    /**
     * @param  list<array{type: string, props: array<string, mixed>, styles?: array<string, mixed>}>  $blocks
     * @return list<array<string, mixed>>
     */
    private function contentBlocks(array $blocks): array
    {
        return collect($blocks)
            ->map(fn (array $block, int $index): array => [
                'id' => $index + 1,
                'type' => $block['type'],
                'data' => $block['props'],
                'styles' => $block['styles'] ?? [],
                'children' => [],
            ])
            ->all();
    }
}
