<?php

namespace Jamalapriadi\DynamicContentBuilder\Support;

final class RichTextSanitizer
{
    public function sanitize(?string $html): ?string
    {
        if ($html === null) {
            return null;
        }

        $html = trim($html);

        if ($html === '') {
            return null;
        }

        if (class_exists(\HTMLPurifier::class) && class_exists(\HTMLPurifier_Config::class)) {
            $config = \HTMLPurifier_Config::createDefault();
            $config->set('HTML.SafeEmbed', false);
            $config->set('HTML.SafeIframe', false);
            $config->set('URI.DisableExternalResources', true);
            $config->set('URI.DisableResources', true);
            $config->set('HTML.Allowed', implode(',', [
                'p',
                'br',
                'strong',
                'em',
                'b',
                'i',
                'u',
                's',
                'blockquote',
                'ul',
                'ol',
                'li',
                'h1',
                'h2',
                'h3',
                'h4',
                'h5',
                'h6',
                'a[href|target|rel]',
                'img[src|alt|width|height]',
                'table',
                'thead',
                'tbody',
                'tr',
                'th',
                'td',
                'hr',
            ]));
            $config->set('AutoFormat.RemoveEmpty', true);
            $config->set('Attr.AllowedFrameTargets', ['_blank']);
            $config->set('HTML.Nofollow', true);

            return (new \HTMLPurifier($config))->purify($html);
        }

        return strip_tags($html, '<p><br><strong><em><b><i><u><s><blockquote><ul><ol><li><h1><h2><h3><h4><h5><h6><a><img><table><thead><tbody><tr><th><td><hr>');
    }
}
