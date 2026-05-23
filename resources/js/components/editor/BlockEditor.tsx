// components/editor/BlockEditor.tsx

import { useState } from 'react';

import type { BlockType } from './blocks/block';
import { BLOCK_REGISTRY } from './blocks/registry';

const fontOptions = [
    'Inter, sans-serif',
    'Arial, sans-serif',
    'Georgia, serif',
    'Times New Roman, serif',
    'Courier New, monospace',
];

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            {label}
            {children}
        </label>
    );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className="h-9 rounded border bg-background px-2 text-sm text-foreground"
        />
    );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            {...props}
            className="h-9 rounded border bg-background px-2 text-sm text-foreground"
        />
    );
}

function CheckboxInput({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex items-center justify-between gap-3 rounded border bg-background px-3 py-2 text-xs font-medium text-muted-foreground">
            <span>{label}</span>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="size-4 rounded border"
            />
        </label>
    );
}

function StylePanel({
    styles,
    onChange,
}: {
    styles: Record<string, string>;
    onChange: (styles: Record<string, string>) => void;
}) {
    const setStyle = (key: string, value: string) => onChange({ [key]: value });

    return (
        <div className="space-y-3">
            <Field label="Font family">
                <SelectInput
                    value={styles.fontFamily ?? ''}
                    onChange={(e) => setStyle('fontFamily', e.target.value)}
                >
                    <option value="">Default</option>
                    {fontOptions.map((font) => (
                        <option key={font} value={font}>
                            {font.split(',')[0]}
                        </option>
                    ))}
                </SelectInput>
            </Field>

            <div className="grid grid-cols-2 gap-2">
                <Field label="Font size">
                    <TextInput
                        value={styles.fontSize ?? ''}
                        onChange={(e) => setStyle('fontSize', e.target.value)}
                        placeholder="18px"
                    />
                </Field>
                <Field label="Weight">
                    <SelectInput
                        value={styles.fontWeight ?? ''}
                        onChange={(e) => setStyle('fontWeight', e.target.value)}
                    >
                        <option value="">Default</option>
                        <option value="400">Regular</option>
                        <option value="500">Medium</option>
                        <option value="600">Semibold</option>
                        <option value="700">Bold</option>
                    </SelectInput>
                </Field>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <Field label="Text color">
                    <TextInput
                        type="color"
                        value={styles.color ?? '#111827'}
                        onChange={(e) => setStyle('color', e.target.value)}
                    />
                </Field>
                <Field label="Background">
                    <TextInput
                        type="color"
                        value={styles.backgroundColor ?? '#ffffff'}
                        onChange={(e) =>
                            setStyle('backgroundColor', e.target.value)
                        }
                    />
                </Field>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <Field label="Alignment">
                    <SelectInput
                        value={styles.textAlign ?? ''}
                        onChange={(e) => setStyle('textAlign', e.target.value)}
                    >
                        <option value="">Default</option>
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                        <option value="justify">Justify</option>
                    </SelectInput>
                </Field>
                <Field label="Line height">
                    <TextInput
                        value={styles.lineHeight ?? ''}
                        onChange={(e) => setStyle('lineHeight', e.target.value)}
                        placeholder="1.6"
                    />
                </Field>
            </div>
        </div>
    );
}

const spacingKeys = ['Top', 'Right', 'Bottom', 'Left'];

function SettingsPanel({
    styles,
    onChange,
}: {
    styles: Record<string, string>;
    onChange: (styles: Record<string, string>) => void;
}) {
    const setStyle = (key: string, value: string) => onChange({ [key]: value });
    const setBooleanStyle = (key: string, checked: boolean) =>
        onChange({ [key]: checked ? 'true' : '' });

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                    Layout
                </p>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Display">
                        <SelectInput
                            value={styles.display ?? ''}
                            onChange={(e) =>
                                setStyle('display', e.target.value)
                            }
                        >
                            <option value="">Default</option>
                            <option value="block">Block</option>
                            <option value="flex">Flex</option>
                            <option value="grid">Grid</option>
                        </SelectInput>
                    </Field>
                    <Field label="Gap">
                        <TextInput
                            value={styles.gap ?? ''}
                            onChange={(e) => setStyle('gap', e.target.value)}
                            placeholder="16px"
                        />
                    </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Align items">
                        <SelectInput
                            value={styles.alignItems ?? ''}
                            onChange={(e) =>
                                setStyle('alignItems', e.target.value)
                            }
                        >
                            <option value="">Default</option>
                            <option value="flex-start">Start</option>
                            <option value="center">Center</option>
                            <option value="flex-end">End</option>
                            <option value="stretch">Stretch</option>
                            <option value="baseline">Baseline</option>
                        </SelectInput>
                    </Field>
                    <Field label="Justify">
                        <SelectInput
                            value={styles.justifyContent ?? ''}
                            onChange={(e) =>
                                setStyle('justifyContent', e.target.value)
                            }
                        >
                            <option value="">Default</option>
                            <option value="flex-start">Start</option>
                            <option value="center">Center</option>
                            <option value="flex-end">End</option>
                            <option value="space-between">Between</option>
                            <option value="space-around">Around</option>
                            <option value="space-evenly">Evenly</option>
                        </SelectInput>
                    </Field>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                    Position
                </p>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Position">
                        <SelectInput
                            value={styles.position ?? ''}
                            onChange={(e) =>
                                setStyle('position', e.target.value)
                            }
                        >
                            <option value="">Default</option>
                            <option value="static">Static</option>
                            <option value="relative">Relative</option>
                            <option value="absolute">Absolute</option>
                            <option value="sticky">Sticky</option>
                            <option value="fixed">Fixed</option>
                        </SelectInput>
                    </Field>
                    <Field label="Z-index">
                        <TextInput
                            value={styles.zIndex ?? ''}
                            onChange={(e) => setStyle('zIndex', e.target.value)}
                            placeholder="10"
                        />
                    </Field>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                    Margin
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {spacingKeys.map((key) => (
                        <Field key={key} label={key}>
                            <TextInput
                                value={styles[`margin${key}`] ?? ''}
                                onChange={(e) =>
                                    setStyle(`margin${key}`, e.target.value)
                                }
                                placeholder="0px"
                            />
                        </Field>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                    Padding
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {spacingKeys.map((key) => (
                        <Field key={key} label={key}>
                            <TextInput
                                value={styles[`padding${key}`] ?? ''}
                                onChange={(e) =>
                                    setStyle(`padding${key}`, e.target.value)
                                }
                                placeholder="0px"
                            />
                        </Field>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <Field label="Width">
                    <TextInput
                        value={styles.width ?? ''}
                        onChange={(e) => setStyle('width', e.target.value)}
                        placeholder="100%"
                    />
                </Field>
                <Field label="Max width">
                    <TextInput
                        value={styles.maxWidth ?? ''}
                        onChange={(e) => setStyle('maxWidth', e.target.value)}
                        placeholder="720px"
                    />
                </Field>
            </div>

            <Field label="Radius">
                <TextInput
                    value={styles.borderRadius ?? ''}
                    onChange={(e) => setStyle('borderRadius', e.target.value)}
                    placeholder="8px"
                />
            </Field>

            <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                    Responsive visibility
                </p>
                <div className="grid gap-2">
                    <CheckboxInput
                        label="Hide on mobile"
                        checked={styles.hideMobile === 'true'}
                        onChange={(checked) =>
                            setBooleanStyle('hideMobile', checked)
                        }
                    />
                    <CheckboxInput
                        label="Hide on tablet"
                        checked={styles.hideTablet === 'true'}
                        onChange={(checked) =>
                            setBooleanStyle('hideTablet', checked)
                        }
                    />
                    <CheckboxInput
                        label="Hide on desktop"
                        checked={styles.hideDesktop === 'true'}
                        onChange={(checked) =>
                            setBooleanStyle('hideDesktop', checked)
                        }
                    />
                </div>
            </div>
        </div>
    );
}

/**
 * Inner editor component — rendered as a proper React component
 * so React tracks DOM identity and inputs don't lose focus on re-render.
 */
function BlockEditorInner({
    data,
    onChange,
    editorFn,
}: {
    data: any;
    onChange: (newData: any) => void;
    editorFn: (props: {
        data: any;
        onChange: (v: any) => void;
    }) => React.ReactNode;
}) {
    return <>{editorFn({ data, onChange })}</>;
}

export default function BlockEditor({ block, updateBlock }: any) {
    const [activeTab, setActiveTab] = useState<
        'content' | 'style' | 'settings'
    >('content');

    if (!block) {
        return null;
    }

    const Component = BLOCK_REGISTRY[block.type as BlockType];

    if (!Component || !Component.editor) {
        return (
            <p className="text-sm text-muted-foreground">
                No editor available for block type: {block.type}
            </p>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 rounded border bg-muted p-1 text-xs">
                {(['content', 'style', 'settings'] as const).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`rounded px-2 py-1.5 capitalize transition ${
                            activeTab === tab
                                ? 'bg-background font-semibold shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'content' && (
                <BlockEditorInner
                    key={block.id}
                    data={block.data}
                    onChange={(newData: any) =>
                        updateBlock(block.id, newData, 'data')
                    }
                    editorFn={Component.editor}
                />
            )}

            {activeTab === 'style' && (
                <StylePanel
                    styles={block.styles ?? {}}
                    onChange={(styles) =>
                        updateBlock(block.id, styles, 'styles')
                    }
                />
            )}

            {activeTab === 'settings' && (
                <SettingsPanel
                    styles={block.styles ?? {}}
                    onChange={(styles) =>
                        updateBlock(block.id, styles, 'styles')
                    }
                />
            )}
        </div>
    );
}
