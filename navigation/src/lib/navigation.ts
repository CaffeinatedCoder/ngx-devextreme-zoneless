import { Directive, model } from '@angular/core';
import type { DxAccordionComponent } from 'devextreme-angular/ui/accordion';
import type { DxButtonGroupComponent } from 'devextreme-angular/ui/button-group';
import type { DxDrawerComponent } from 'devextreme-angular/ui/drawer';
import type { DxDropDownButtonComponent } from 'devextreme-angular/ui/drop-down-button';
import type { DxGalleryComponent } from 'devextreme-angular/ui/gallery';
import type { DxListComponent } from 'devextreme-angular/ui/list';
import type { DxMultiViewComponent } from 'devextreme-angular/ui/multi-view';
import type { DxPaginationComponent } from 'devextreme-angular/ui/pagination';
import type { DxStepperComponent } from 'devextreme-angular/ui/stepper';
import type { DxTabPanelComponent } from 'devextreme-angular/ui/tab-panel';
import type { DxTabsComponent } from 'devextreme-angular/ui/tabs';
import {
    DxBindingDirectiveBase,
    DxOpenedDirectiveBase,
    DxSelectedIndexDirectiveBase,
    DxSelectedItemKeysDirectiveBase,
    injectDxHost,
} from 'ngx-devextreme-zoneless/core';

/** `[(dxSelectedIndex)]` for `dx-tabs`. */
@Directive({ selector: 'dx-tabs[dxSelectedIndex]', exportAs: 'dxSelectedIndex' })
export class DxTabsSelectedIndexDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxSelectedIndexDirectiveBase<DxTabsComponent<TItem, TKey>> {
    constructor() {
        super(injectDxHost<DxTabsComponent>(), 'selectedIndex');
    }
}

/** `[(dxSelectedIndex)]` for `dx-tab-panel`. */
@Directive({ selector: 'dx-tab-panel[dxSelectedIndex]', exportAs: 'dxSelectedIndex' })
export class DxTabPanelSelectedIndexDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxSelectedIndexDirectiveBase<DxTabPanelComponent<TItem, TKey>> {
    constructor() {
        super(injectDxHost<DxTabPanelComponent>(), 'selectedIndex');
    }
}

/** `[(dxSelectedIndex)]` for `dx-accordion`. */
@Directive({ selector: 'dx-accordion[dxSelectedIndex]', exportAs: 'dxSelectedIndex' })
export class DxAccordionSelectedIndexDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxSelectedIndexDirectiveBase<DxAccordionComponent<TItem, TKey>> {
    constructor() {
        super(injectDxHost<DxAccordionComponent>(), 'selectedIndex');
    }
}

/** `[(dxSelectedIndex)]` for `dx-gallery`. */
@Directive({ selector: 'dx-gallery[dxSelectedIndex]', exportAs: 'dxSelectedIndex' })
export class DxGallerySelectedIndexDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxSelectedIndexDirectiveBase<DxGalleryComponent<TItem, TKey>> {
    constructor() {
        super(injectDxHost<DxGalleryComponent>(), 'selectedIndex');
    }
}

/** `[(dxSelectedItemKeys)]` for `dx-list` (works with any `selectionMode`). */
@Directive({ selector: 'dx-list[dxSelectedItemKeys]', exportAs: 'dxSelectedItemKeys' })
export class DxListSelectedItemKeysDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxSelectedItemKeysDirectiveBase<DxListComponent<TItem, TKey>, TKey> {
    constructor() {
        super(injectDxHost<DxListComponent>(), 'selectedItemKeys');
    }
}

/** `[(dxOpened)]` for `dx-drawer`. */
@Directive({ selector: 'dx-drawer[dxOpened]', exportAs: 'dxOpened' })
export class DxDrawerOpenedDirective extends DxOpenedDirectiveBase<DxDrawerComponent> {
    constructor() {
        super(injectDxHost<DxDrawerComponent>(), 'opened');
    }
}

/** `[(dxOpened)]` for `dx-drop-down-button` — the drop-down's open state. */
@Directive({ selector: 'dx-drop-down-button[dxOpened]', exportAs: 'dxOpened' })
export class DxDropDownButtonOpenedDirective extends DxOpenedDirectiveBase<DxDropDownButtonComponent> {
    constructor() {
        super(injectDxHost<DxDropDownButtonComponent>(), 'opened');
    }
}

/* ------------------------------------------------------------------------ *
 *  Selection breadth (4.0). `selectedItemKeys` comes from the shared
 *  CollectionWidget options, so every collection widget carries it; these are
 *  the ones where a key-set is what a consumer keeps rather than an index —
 *  multi-select tabs (`selectionMode="multiple"`), an accordion with
 *  `[multiple]="true"`, a button group. Not the tab panel: its selection is
 *  single by construction and `[(dxSelectedIndex)]` already owns it.
 * ------------------------------------------------------------------------ */

/** `[(dxSelectedItemKeys)]` for `dx-tabs` (pair with `selectionMode="multiple"` for a set). */
@Directive({ selector: 'dx-tabs[dxSelectedItemKeys]', exportAs: 'dxSelectedItemKeys' })
export class DxTabsSelectedItemKeysDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxSelectedItemKeysDirectiveBase<DxTabsComponent<TItem, TKey>, TKey> {
    constructor() {
        super(injectDxHost<DxTabsComponent>(), 'selectedItemKeys');
    }
}

/** `[(dxSelectedItemKeys)]` for `dx-accordion` (pair with `[multiple]="true"` for a set). */
@Directive({ selector: 'dx-accordion[dxSelectedItemKeys]', exportAs: 'dxSelectedItemKeys' })
export class DxAccordionSelectedItemKeysDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxSelectedItemKeysDirectiveBase<DxAccordionComponent<TItem, TKey>, TKey> {
    constructor() {
        super(injectDxHost<DxAccordionComponent>(), 'selectedItemKeys');
    }
}

/** `[(dxSelectedItemKeys)]` for `dx-button-group`. */
@Directive({ selector: 'dx-button-group[dxSelectedItemKeys]', exportAs: 'dxSelectedItemKeys' })
export class DxButtonGroupSelectedItemKeysDirective<
    TKey = unknown,
> extends DxSelectedItemKeysDirectiveBase<DxButtonGroupComponent, TKey> {
    constructor() {
        super(injectDxHost<DxButtonGroupComponent>(), 'selectedItemKeys');
    }
}

/** `[(dxSelectedIndex)]` for `dx-multi-view`. */
@Directive({ selector: 'dx-multi-view[dxSelectedIndex]', exportAs: 'dxSelectedIndex' })
export class DxMultiViewSelectedIndexDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxSelectedIndexDirectiveBase<DxMultiViewComponent<TItem, TKey>> {
    constructor() {
        super(injectDxHost<DxMultiViewComponent>(), 'selectedIndex');
    }
}

/** `[(dxSelectedIndex)]` for `dx-stepper`. */
@Directive({ selector: 'dx-stepper[dxSelectedIndex]', exportAs: 'dxSelectedIndex' })
export class DxStepperSelectedIndexDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxSelectedIndexDirectiveBase<DxStepperComponent<TItem, TKey>> {
    constructor() {
        super(injectDxHost<DxStepperComponent>(), 'selectedIndex');
    }
}

/**
 * `[(dxPageIndex)]` for the standalone `dx-pagination` pager. Note the
 * widget's own convention: its `pageIndex` is **1-based**, unlike the grids'
 * zero-based `[(dxPageIndex)]`.
 */
@Directive({ selector: 'dx-pagination[dxPageIndex]', exportAs: 'dxPageIndex' })
export class DxPaginationPageIndexDirective extends DxBindingDirectiveBase {
    readonly dxPageIndex = model.required<number>();

    constructor() {
        super();
        this.bindOption<DxPaginationComponent, number>(
            injectDxHost<DxPaginationComponent>(),
            'pageIndex',
            this.dxPageIndex,
        );
    }
}

/** `[(dxPageSize)]` for the standalone `dx-pagination` pager. */
@Directive({ selector: 'dx-pagination[dxPageSize]', exportAs: 'dxPageSize' })
export class DxPaginationPageSizeDirective extends DxBindingDirectiveBase {
    readonly dxPageSize = model.required<number>();

    constructor() {
        super();
        this.bindOption<DxPaginationComponent, number>(
            injectDxHost<DxPaginationComponent>(),
            'pageSize',
            this.dxPageSize,
        );
    }
}

/** All navigation adapter directives, for convenient bulk import. */
export const DX_NAVIGATION_DIRECTIVES = [
    DxAccordionSelectedIndexDirective,
    DxAccordionSelectedItemKeysDirective,
    DxButtonGroupSelectedItemKeysDirective,
    DxDrawerOpenedDirective,
    DxDropDownButtonOpenedDirective,
    DxGallerySelectedIndexDirective,
    DxListSelectedItemKeysDirective,
    DxMultiViewSelectedIndexDirective,
    DxPaginationPageIndexDirective,
    DxPaginationPageSizeDirective,
    DxStepperSelectedIndexDirective,
    DxTabPanelSelectedIndexDirective,
    DxTabsSelectedIndexDirective,
    DxTabsSelectedItemKeysDirective,
] as const;
