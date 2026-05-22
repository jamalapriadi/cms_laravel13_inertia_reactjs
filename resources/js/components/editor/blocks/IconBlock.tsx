import {
    CheckCircle,
    Heart,
    Info,
    Mail,
    Phone,
    Search,
    Shield,
    ShoppingCart,
    Smile,
    Star,
    Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface IconData {
    icon: keyof typeof iconMap;
    size: number;
    color: string;
    label: string;
}

const iconMap = {
    CheckCircle,
    Heart,
    Info,
    Mail,
    Phone,
    Search,
    Shield,
    ShoppingCart,
    Smile,
    Star,
    Zap,
};

export default {
    type: 'icon',

    create(): IconData {
        return {
            icon: 'Star',
            size: 32,
            color: '#111827',
            label: '',
        };
    },

    render({ data }: any) {
        const iconName = data?.icon ?? 'Star';
        const Icon = (iconMap[iconName as keyof typeof iconMap] ??
            Star) as LucideIcon;

        return (
            <Icon
                size={Number(data?.size) || 32}
                color={data?.color || '#111827'}
                aria-label={data?.label || iconName}
                role="img"
            />
        );
    },

    editor({ data, onChange }: any) {
        return (
            <div className="space-y-3">
                <div>
                    <label className="text-xs text-muted-foreground">
                        Icon
                    </label>
                    <select
                        className="w-full rounded border p-2"
                        value={data?.icon ?? 'Star'}
                        onChange={(e) => onChange({ icon: e.target.value })}
                    >
                        {Object.keys(iconMap).map((icon) => (
                            <option key={icon} value={icon}>
                                {icon}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-xs text-muted-foreground">
                        Size
                    </label>
                    <input
                        type="number"
                        min={12}
                        max={128}
                        className="w-full rounded border p-2"
                        value={data?.size ?? 32}
                        onChange={(e) =>
                            onChange({ size: Number(e.target.value) })
                        }
                    />
                </div>

                <div>
                    <label className="text-xs text-muted-foreground">
                        Color
                    </label>
                    <input
                        type="color"
                        className="h-10 w-full rounded border p-1"
                        value={data?.color ?? '#111827'}
                        onChange={(e) => onChange({ color: e.target.value })}
                    />
                </div>

                <div>
                    <label className="text-xs text-muted-foreground">
                        Accessible label
                    </label>
                    <input
                        className="w-full rounded border p-2"
                        value={data?.label ?? ''}
                        onChange={(e) => onChange({ label: e.target.value })}
                        placeholder="Optional"
                    />
                </div>
            </div>
        );
    },
};
