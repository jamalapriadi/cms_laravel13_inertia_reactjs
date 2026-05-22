import type { CSSProperties } from 'react';

export type BlockStyles = Record<string, string | undefined>;

const pick = (styles: BlockStyles | undefined, key: string) => {
    const value = styles?.[key];

    return value && value.trim() !== '' ? value : undefined;
};

export function buildBlockStyle(
    styles: BlockStyles | undefined,
): CSSProperties {
    return {
        fontFamily: pick(styles, 'fontFamily'),
        fontSize: pick(styles, 'fontSize'),
        color: pick(styles, 'color'),
        backgroundColor: pick(styles, 'backgroundColor'),
        textAlign: pick(styles, 'textAlign') as CSSProperties['textAlign'],
        fontWeight: pick(styles, 'fontWeight'),
        lineHeight: pick(styles, 'lineHeight'),
        marginTop: pick(styles, 'marginTop'),
        marginRight: pick(styles, 'marginRight'),
        marginBottom: pick(styles, 'marginBottom'),
        marginLeft: pick(styles, 'marginLeft'),
        paddingTop: pick(styles, 'paddingTop'),
        paddingRight: pick(styles, 'paddingRight'),
        paddingBottom: pick(styles, 'paddingBottom'),
        paddingLeft: pick(styles, 'paddingLeft'),
        width: pick(styles, 'width'),
        maxWidth: pick(styles, 'maxWidth'),
        borderRadius: pick(styles, 'borderRadius'),
    };
}
