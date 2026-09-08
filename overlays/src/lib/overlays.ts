import { Directive } from '@angular/core';
import type { DxActionSheetComponent } from 'devextreme-angular/ui/action-sheet';
import type { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import type { DxLoadPanelComponent } from 'devextreme-angular/ui/load-panel';
import type { DxPopoverComponent } from 'devextreme-angular/ui/popover';
import type { DxPopupComponent } from 'devextreme-angular/ui/popup';
import type { DxToastComponent } from 'devextreme-angular/ui/toast';
import type { DxTooltipComponent } from 'devextreme-angular/ui/tooltip';
import { DxVisibleDirectiveBase, injectDxHost } from 'ngx-devextreme-zoneless/core';

/**
 * `[(dxVisible)]` adapter directives for overlay widgets. The signal follows
 * every way the overlay can close (shading click, escape key, close button,
 * API calls) — the classic pain point of overlays under zoneless change
 * detection.
 */

@Directive({ selector: 'dx-popup[dxVisible]', exportAs: 'dxVisible' })
export class DxPopupVisibleDirective extends DxVisibleDirectiveBase<DxPopupComponent> {
    constructor() {
        super(injectDxHost<DxPopupComponent>(), 'visible');
    }
}

@Directive({ selector: 'dx-popover[dxVisible]', exportAs: 'dxVisible' })
export class DxPopoverVisibleDirective extends DxVisibleDirectiveBase<DxPopoverComponent> {
    constructor() {
        super(injectDxHost<DxPopoverComponent>(), 'visible');
    }
}

@Directive({ selector: 'dx-tooltip[dxVisible]', exportAs: 'dxVisible' })
export class DxTooltipVisibleDirective extends DxVisibleDirectiveBase<DxTooltipComponent> {
    constructor() {
        super(injectDxHost<DxTooltipComponent>(), 'visible');
    }
}

@Directive({ selector: 'dx-toast[dxVisible]', exportAs: 'dxVisible' })
export class DxToastVisibleDirective extends DxVisibleDirectiveBase<DxToastComponent> {
    constructor() {
        super(injectDxHost<DxToastComponent>(), 'visible');
    }
}

@Directive({ selector: 'dx-load-panel[dxVisible]', exportAs: 'dxVisible' })
export class DxLoadPanelVisibleDirective extends DxVisibleDirectiveBase<DxLoadPanelComponent> {
    constructor() {
        super(injectDxHost<DxLoadPanelComponent>(), 'visible');
    }
}

@Directive({ selector: 'dx-action-sheet[dxVisible]', exportAs: 'dxVisible' })
export class DxActionSheetVisibleDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxVisibleDirectiveBase<DxActionSheetComponent<TItem, TKey>> {
    constructor() {
        super(injectDxHost<DxActionSheetComponent>(), 'visible');
    }
}

/** All overlay `[(dxVisible)]` directives, for convenient bulk import. */
/** `[(dxVisible)]` for `dx-context-menu` — open it from a signal, follow every way it closes. */
@Directive({ selector: 'dx-context-menu[dxVisible]', exportAs: 'dxVisible' })
export class DxContextMenuVisibleDirective extends DxVisibleDirectiveBase<DxContextMenuComponent> {
    constructor() {
        super(injectDxHost<DxContextMenuComponent>(), 'visible');
    }
}

export const DX_VISIBLE_DIRECTIVES = [
    DxActionSheetVisibleDirective,
    DxContextMenuVisibleDirective,
    DxLoadPanelVisibleDirective,
    DxPopoverVisibleDirective,
    DxPopupVisibleDirective,
    DxToastVisibleDirective,
    DxTooltipVisibleDirective,
] as const;
