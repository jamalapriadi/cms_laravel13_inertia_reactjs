import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import type { Media } from '@/types/media';
import MediaGallery from './MediaGallery';
import MediaSidebar from './MediaSidebar';
import MediaDropzone from './MediaDropzone';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (media: Media) => void;
    modelType?: string;
    modelId?: string;
}

export default function MediaModal({ isOpen, onClose, onSelect }: Props) {
    const [tab, setTab] = useState<'library' | 'upload'>('library');
    const [selected, setSelected] = useState<Media | null>(null);

    function handleInsert() {
        if (!selected) return;
        onSelect(selected);
        onClose();
    }

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/40" />

            <div className="fixed inset-0 flex items-center justify-center">
                <Dialog.Panel className="flex h-[90vh] w-[95%] flex-col rounded bg-card shadow-xl">
                    {/* HEADER */}
                    <div className="flex items-center justify-between border-b px-6 py-4">
                        <h2 className="text-lg font-semibold">Media Library</h2>
                        <button onClick={onClose}>✕</button>
                    </div>

                    {/* TABS */}
                    <div className="flex border-b px-6">
                        <button
                            onClick={() => setTab('library')}
                            className={`mr-6 border-b-2 py-3 ${
                                tab === 'library'
                                    ? 'border-blue-600 font-semibold'
                                    : 'border-transparent'
                            }`}
                        >
                            Media Library
                        </button>

                        <button
                            onClick={() => setTab('upload')}
                            className={`border-b-2 py-3 ${
                                tab === 'upload'
                                    ? 'border-blue-600 font-semibold'
                                    : 'border-transparent'
                            }`}
                        >
                            Upload Files
                        </button>
                    </div>

                    {/* BODY */}
                    <div className="flex flex-1 overflow-hidden">
                        {tab === 'upload' ? (
                            <MediaDropzone />
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto p-6">
                                    <MediaGallery
                                        selected={selected}
                                        onSelect={setSelected}
                                    />
                                </div>

                                <div className="w-80 overflow-y-auto border-l p-6">
                                    <MediaSidebar
                                        media={selected}
                                        onUpdate={setSelected}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* FOOTER */}
                    {tab === 'library' && (
                        <div className="flex justify-end border-t p-4">
                            <button
                                onClick={handleInsert}
                                disabled={!selected}
                                className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                            >
                                Select
                            </button>
                        </div>
                    )}
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
