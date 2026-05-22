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
        display: pick(styles, 'display') as CSSProperties['display'],
        gap: pick(styles, 'gap'),
        alignItems: pick(styles, 'alignItems') as CSSProperties['alignItems'],
        justifyContent: pick(styles, 'justifyContent') as
            | CSSProperties['justifyContent']
            | undefined,
        position: pick(styles, 'position') as CSSProperties['position'],
        zIndex: pick(styles, 'zIndex'),
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

export function buildVisibilityClass(styles: BlockStyles | undefined): string {
    return [
        styles?.hideMobile === 'true' ? 'max-sm:hidden' : '',
        styles?.hideTablet === 'true' ? 'sm:max-lg:hidden' : '',
        styles?.hideDesktop === 'true' ? 'lg:hidden' : '',
    ]
        .filter(Boolean)
        .join(' ');
}
