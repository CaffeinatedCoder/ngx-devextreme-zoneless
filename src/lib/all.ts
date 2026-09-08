import { DX_DATA_DIRECTIVES } from 'ngx-devextreme-zoneless/data';
import {
    DX_EDITOR_STATE_DIRECTIVES,
    DX_OPENED_DIRECTIVES,
    DX_VALUE_DIRECTIVES,
} from 'ngx-devextreme-zoneless/editors';
import { DX_NAVIGATION_DIRECTIVES } from 'ngx-devextreme-zoneless/navigation';
import { DX_VISIBLE_DIRECTIVES } from 'ngx-devextreme-zoneless/overlays';
import { DX_VISUALIZATION_DIRECTIVES } from 'ngx-devextreme-zoneless/visualization';

/**
 * Every adapter directive of this library, for a single-line `imports` entry:
 *
 * ```ts
 * @Component({ imports: [DxTextBoxModule, ..., DX_SIGNAL_DIRECTIVES] })
 * ```
 */
export const DX_SIGNAL_DIRECTIVES = [
    ...DX_VALUE_DIRECTIVES,
    ...DX_OPENED_DIRECTIVES,
    ...DX_EDITOR_STATE_DIRECTIVES,
    ...DX_NAVIGATION_DIRECTIVES,
    ...DX_VISIBLE_DIRECTIVES,
    ...DX_DATA_DIRECTIVES,
    ...DX_VISUALIZATION_DIRECTIVES,
] as const;
