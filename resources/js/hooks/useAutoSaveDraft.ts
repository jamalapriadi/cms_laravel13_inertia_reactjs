import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface AutoSaveOptions<T> {
    resourceType: 'posts' | 'pages';
    data: T;
    setData: (key: any, value?: any) => void;
    hasContent: (data: T) => boolean;
    isEdit: boolean;
    initialDraftId?: number | null;
    debounceMs?: number;
    disabled?: boolean;
}

export function useAutoSaveDraft<T extends Record<string, any>>({
    resourceType,
    data,
    setData,
    hasContent,
    isEdit,
    initialDraftId = null,
    debounceMs = 3000,
    disabled = false,
}: AutoSaveOptions<T>) {
    const [draftId, setDraftId] = useState<number | null>(initialDraftId);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const lastSavedDataRef = useRef<string>('');
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialMountRef = useRef<boolean>(true);

    // Update draftId if initialDraftId changes
    useEffect(() => {
        if (initialDraftId) {
            setDraftId(initialDraftId);
        }
    }, [initialDraftId]);

    // Handle beforeunload to warn user if saving is in progress
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (status === 'saving') {
                e.preventDefault();
                e.returnValue = 'Autosave is in progress. Are you sure you want to leave?';
                return e.returnValue;
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [status]);

    useEffect(() => {
        if (disabled) {
            return;
        }

        // Avoid running autosave on initial mount
        if (isInitialMountRef.current) {
            isInitialMountRef.current = false;
            // Record initial data so we don't autosave immediately
            lastSavedDataRef.current = JSON.stringify(data);
            return;
        }

        const currentDataStr = JSON.stringify(data);

        // If data hasn't changed from last saved state, skip
        if (currentDataStr === lastSavedDataRef.current) {
            return;
        }

        // If it's a new draft and doesn't have meaningful content yet, skip
        if (!draftId && !hasContent(data)) {
            return;
        }

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            performSave(currentDataStr);
        }, debounceMs);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [data, draftId, resourceType, debounceMs, disabled]);

    const performSave = async (dataToSaveStr: string) => {
        const parsedData = JSON.parse(dataToSaveStr);
        
        setStatus('saving');
        setError(null);

        const url = draftId
            ? `/my-admin/dashboard/${resourceType}/${draftId}/auto-save`
            : `/my-admin/dashboard/${resourceType}/auto-save`;

        const method = draftId ? 'put' : 'post';

        try {
            const response = await axios({
                method,
                url,
                data: parsedData,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });

            const responseData = response.data;
            if (responseData && responseData.id) {
                const newId = responseData.id;
                
                // If it's a new draft that was just created, update the URL & state
                if (!draftId) {
                    setDraftId(newId);
                    window.history.replaceState(
                        null,
                        '',
                        `/my-admin/dashboard/${resourceType}/${newId}/edit`
                    );
                }
                
                lastSavedDataRef.current = dataToSaveStr;
                setStatus('saved');
                
                const now = new Date();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                setLastSaved(`${hours}:${minutes}:${seconds}`);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err: any) {
            console.error('Autosave error:', err);
            setStatus('failed');
            setError(err.response?.data?.message || err.message || 'Unknown error');
        }
    };

    return {
        draftId,
        status,
        lastSaved,
        error,
        forceSave: () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            performSave(JSON.stringify(data));
        }
    };
}
