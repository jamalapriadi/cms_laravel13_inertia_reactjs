import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function MenuSourcePanel({ onAdd }) {
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');

    function addCustomLink() {
        if (!title) return;

        onAdd({
            title,
            url,
            children: [],
        });

        setTitle('');
        setUrl('');
    }

    return (
        <div className="space-y-4 rounded-xl border p-4">
            <h2 className="font-semibold">Custom Link</h2>

            <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <Input
                placeholder="URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
            />

            <Button onClick={addCustomLink}>Add to Menu</Button>
        </div>
    );
}
