import { DX_DATA_DIRECTIVES } from './data';
import { DX_VALUE_DIRECTIVES } from './editors';
import { DX_NAVIGATION_DIRECTIVES } from './navigation';
import { DX_VISIBLE_DIRECTIVES } from './overlays';
import { DX_VISUALIZATION_DIRECTIVES } from './visualization';

/**
 * Every adapter directive of this library, for a single-line `imports` entry:
 *
 * ```ts
 * @Component({ imports: [DxTextBoxModule, ..., DX_SIGNAL_DIRECTIVES] })
 * ```
 */
export const DX_SIGNAL_DIRECTIVES = [
    ...DX_VALUE_DIRECTIVES,
    ...DX_NAVIGATION_DIRECTIVES,
    ...DX_VISIBLE_DIRECTIVES,
    ...DX_DATA_DIRECTIVES,
    ...DX_VISUALIZATION_DIRECTIVES,
] as const;
