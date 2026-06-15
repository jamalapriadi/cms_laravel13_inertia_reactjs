<?php

namespace App\Services\WordpressMigration;

use App\Models\Dashboard\Media;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MediaMigrator extends BaseMigrator
{
    public function migrate(array &$report): void
    {
        $report['media'] = [
            'total' => 0,
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'errors' => 0,
        ];

        try {
            $wpAttachments = DB::connection('wordpress')
                ->table($this->wpTable('posts'))
                ->where('post_type', 'attachment')
                ->select('ID', 'post_title', 'post_mime_type')
                ->when($this->limit, fn ($q) => $q->limit($this->limit))
                ->get();
        } catch (\Throwable $e) {
            $report['media']['errors']++;
            logger()->error('WordPress Media Migration: Failed to query source database: '.$e->getMessage());

            return;
        }

        $report['media']['total'] = $wpAttachments->count();

        foreach ($wpAttachments as $wpAttachment) {
            try {
                $mappedUuid = $this->getMappedId($wpAttachment->ID, 'media');

                // Retrieve file path and alt text from postmeta
                $attachedFile = DB::connection('wordpress')
                    ->table($this->wpTable('postmeta'))
                    ->where('post_id', $wpAttachment->ID)
                    ->where('meta_key', '_wp_attached_file')
                    ->value('meta_value');

                if (! $attachedFile) {
                    $report['media']['skipped']++;

                    continue;
                }

                $altText = DB::connection('wordpress')
                    ->table($this->wpTable('postmeta'))
                    ->where('post_id', $wpAttachment->ID)
                    ->where('meta_key', '_wp_attachment_image_alt')
                    ->value('meta_value');

                // Normalize file path relative to public storage directory
                $path = 'uploads/'.ltrim((string) $attachedFile, '/');
                $fileName = basename($path);

                if ($this->dryRun) {
                    if ($mappedUuid) {
                        $report['media']['updated']++;
                    } else {
                        $report['media']['created']++;
                    }

                    continue;
                }

                $data = [
                    'name' => $wpAttachment->post_title ?: pathinfo($fileName, PATHINFO_FILENAME),
                    'file_name' => $fileName,
                    'mime_type' => $wpAttachment->post_mime_type,
                    'path' => $path,
                    'disk' => 'public',
                    'alt' => $altText ?: null,
                    'collection_name' => 'default',
                ];

                if ($mappedUuid) {
                    $media = Media::find($mappedUuid);
                    if ($media) {
                        $media->update($data);
                        $report['media']['updated']++;
                    } else {
                        $media = new Media($data);
                        $media->id = (string) Str::uuid();
                        $media->uuid = (string) Str::uuid();
                        $media->save();

                        $this->recordMapping($wpAttachment->ID, 'media', 'media', $media->id);
                        $report['media']['created']++;
                    }
                } else {
                    $media = new Media($data);
                    $media->id = (string) Str::uuid();
                    $media->uuid = (string) Str::uuid();
                    $media->save();

                    $this->recordMapping($wpAttachment->ID, 'media', 'media', $media->id);
                    $report['media']['created']++;
                }
            } catch (\Throwable $e) {
                $report['media']['errors']++;
                logger()->error("WordPress Media Migration: Failed for ID {$wpAttachment->ID}: ".$e->getMessage());
            }
        }
    }

    public function rollback(array &$report): void
    {
        $report['media_rollback'] = [
            'deleted' => 0,
            'errors' => 0,
        ];

        try {
            $laravelUuids = $this->deleteMappingsForType('media');

            if ($this->dryRun) {
                $report['media_rollback']['deleted'] = count($laravelUuids);

                return;
            }

            if (! empty($laravelUuids)) {
                $deletedCount = Media::whereIn('id', $laravelUuids)->delete();
                $report['media_rollback']['deleted'] = $deletedCount;
            }
        } catch (\Throwable $e) {
            $report['media_rollback']['errors']++;
            logger()->error('WordPress Media Rollback Failed: '.$e->getMessage());
        }
    }
}
