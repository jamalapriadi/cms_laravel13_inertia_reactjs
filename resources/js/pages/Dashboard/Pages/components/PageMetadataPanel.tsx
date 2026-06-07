import MediaImagePicker from '@/components/media/MediaImagePicker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';

interface Props {
    slug: string;
    excerpt: string;
    featuredImage?: string | null;
    ogImage?: string | null;
    publishedAt?: string | null;
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
    onSlugChange: (value: string) => void;
    onExcerptChange: (value: string) => void;
    onFeaturedImageChange: (path: string | null) => void;
    onOgImageChange: (path: string | null) => void;
    onPublishedAtChange: (value: string) => void;
    onSeoTitleChange: (value: string) => void;
    onSeoDescriptionChange: (value: string) => void;
    onSeoKeywordsChange: (value: string) => void;
}

export default function PageMetadataPanel({
    slug,
    excerpt,
    featuredImage,
    ogImage,
    publishedAt,
    seoTitle,
    seoDescription,
    seoKeywords,
    onSlugChange,
    onExcerptChange,
    onFeaturedImageChange,
    onOgImageChange,
    onPublishedAtChange,
    onSeoTitleChange,
    onSeoDescriptionChange,
    onSeoKeywordsChange,
}: Props) {
    return (
        <div className="space-y-6">
            <section className="space-y-3">
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Page Settings
                </h2>

                <div className="space-y-2">
                    <Label htmlFor="page-slug">Slug</Label>
                    <Input
                        id="page-slug"
                        value={slug}
                        onChange={(event) => onSlugChange(event.target.value)}
                        placeholder="about-us"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="page-excerpt">Excerpt</Label>
                    <Textarea
                        id="page-excerpt"
                        value={excerpt}
                        onChange={(event) =>
                            onExcerptChange(event.target.value)
                        }
                        rows={4}
                    />
                </div>

                <MediaImagePicker
                    label="Featured Image"
                    value={featuredImage}
                    onChange={onFeaturedImageChange}
                />
            </section>

            <section className="space-y-3">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Publish At
                </h3>

                <Input
                    type="datetime-local"
                    value={publishedAt ?? ''}
                    onChange={(event) =>
                        onPublishedAtChange(event.target.value)
                    }
                />
            </section>

            <section className="space-y-3">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    SEO
                </h3>

                <div className="space-y-2">
                    <Label htmlFor="page-seo-title">SEO Title</Label>
                    <Input
                        id="page-seo-title"
                        value={seoTitle}
                        onChange={(event) =>
                            onSeoTitleChange(event.target.value)
                        }
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="page-seo-description">
                        SEO Description
                    </Label>
                    <Textarea
                        id="page-seo-description"
                        value={seoDescription}
                        onChange={(event) =>
                            onSeoDescriptionChange(event.target.value)
                        }
                        rows={4}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="page-seo-keywords">SEO Keywords</Label>
                    <Textarea
                        id="page-seo-keywords"
                        value={seoKeywords}
                        onChange={(event) =>
                            onSeoKeywordsChange(event.target.value)
                        }
                        rows={3}
                    />
                </div>

                <MediaImagePicker
                    label="OG Image"
                    value={ogImage}
                    onChange={onOgImageChange}
                />
            </section>
        </div>
    );
}
