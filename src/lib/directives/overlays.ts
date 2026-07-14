import { Directive, inject } from '@angular/core';
import { DxActionSheetComponent } from 'devextreme-angular/ui/action-sheet';
import { DxLoadPanelComponent } from 'devextreme-angular/ui/load-panel';
import { DxPopoverComponent } from 'devextreme-angular/ui/popover';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxToastComponent } from 'devextreme-angular/ui/toast';
import { DxTooltipComponent } from 'devextreme-angular/ui/tooltip';
import { DxVisibleDirectiveBase } from './bases';

/**
 * `[(dxVisible)]` adapter directives for overlay widgets. The signal follows
 * every way the overlay can close (shading click, escape key, close button,
 * API calls) — the classic pain point of overlays under zoneless change
 * detection.
 */

@Directive({ selector: 'dx-popup[dxVisible]', exportAs: 'dxVisible' })
export class DxPopupVisibleDirective extends DxVisibleDirectiveBase<DxPopupComponent> {
    constructor() {
        super(inject(DxPopupComponent, { self: true }), 'visible');
    }
}

@Directive({ selector: 'dx-popover[dxVisible]', exportAs: 'dxVisible' })
export class DxPopoverVisibleDirective extends DxVisibleDirectiveBase<DxPopoverComponent> {
    constructor() {
        super(inject(DxPopoverComponent, { self: true }), 'visible');
    }
}

@Directive({ selector: 'dx-tooltip[dxVisible]', exportAs: 'dxVisible' })
export class DxTooltipVisibleDirective extends DxVisibleDirectiveBase<DxTooltipComponent> {
    constructor() {
        super(inject(DxTooltipComponent, { self: true }), 'visible');
    }
}

@Directive({ selector: 'dx-toast[dxVisible]', exportAs: 'dxVisible' })
export class DxToastVisibleDirective extends DxVisibleDirectiveBase<DxToastComponent> {
    constructor() {
        super(inject(DxToastComponent, { self: true }), 'visible');
    }
}

@Directive({ selector: 'dx-load-panel[dxVisible]', exportAs: 'dxVisible' })
export class DxLoadPanelVisibleDirective extends DxVisibleDirectiveBase<DxLoadPanelComponent> {
    constructor() {
        super(inject(DxLoadPanelComponent, { self: true }), 'visible');
    }
}

@Directive({ selector: 'dx-action-sheet[dxVisible]', exportAs: 'dxVisible' })
export class DxActionSheetVisibleDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxVisibleDirectiveBase<DxActionSheetComponent<TItem, TKey>> {
    constructor() {
        super(inject(DxActionSheetComponent, { self: true }), 'visible');
    }
}

/** All overlay `[(dxVisible)]` directives, for convenient bulk import. */
export const DX_VISIBLE_DIRECTIVES = [
    DxActionSheetVisibleDirective,
    DxLoadPanelVisibleDirective,
    DxPopoverVisibleDirective,
    DxPopupVisibleDirective,
    DxToastVisibleDirective,
    DxTooltipVisibleDirective,
] as const;
