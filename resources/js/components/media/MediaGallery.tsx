import { usePage } from '@inertiajs/react';
import type { Media } from '@/types/media';

interface Props {
    selected: Media | null;
    onSelect: (media: Media) => void;
}

export default function MediaGallery({ selected, onSelect }: Props) {
    const { media } = usePage().props as any;

    return (
        <div className="grid grid-cols-3 gap-4 md:grid-cols-5 lg:grid-cols-7">
            {media.data.map((item: Media) => (
                <div
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className={`relative cursor-pointer overflow-hidden rounded border ${
                        selected?.id === item.id ? 'ring-4 ring-blue-500' : ''
                    }`}
                >
                    <img
                        src={`/storage/${item.path}`}
                        className="h-28 w-full object-cover"
                    />
                </div>
            ))}
        </div>
    );
}
