import { Directive, inject } from '@angular/core';
import { DxAccordionComponent } from 'devextreme-angular/ui/accordion';
import { DxDrawerComponent } from 'devextreme-angular/ui/drawer';
import { DxGalleryComponent } from 'devextreme-angular/ui/gallery';
import { DxListComponent } from 'devextreme-angular/ui/list';
import { DxTabPanelComponent } from 'devextreme-angular/ui/tab-panel';
import { DxTabsComponent } from 'devextreme-angular/ui/tabs';
import { model } from '@angular/core';
import {
    DxBindingDirectiveBase,
    DxSelectedIndexDirectiveBase,
    DxSelectedItemKeysDirectiveBase,
} from 'ngx-devextreme-zoneless/core';

/** `[(dxSelectedIndex)]` for `dx-tabs`. */
@Directive({ selector: 'dx-tabs[dxSelectedIndex]', exportAs: 'dxSelectedIndex' })
export class DxTabsSelectedIndexDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxSelectedIndexDirectiveBase<DxTabsComponent<TItem, TKey>> {
    constructor() {
        super(inject(DxTabsComponent, { self: true }), 'selectedIndex');
    }
}

/** `[(dxSelectedIndex)]` for `dx-tab-panel`. */
@Directive({ selector: 'dx-tab-panel[dxSelectedIndex]', exportAs: 'dxSelectedIndex' })
export class DxTabPanelSelectedIndexDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxSelectedIndexDirectiveBase<DxTabPanelComponent<TItem, TKey>> {
    constructor() {
        super(inject(DxTabPanelComponent, { self: true }), 'selectedIndex');
    }
}

/** `[(dxSelectedIndex)]` for `dx-accordion`. */
@Directive({ selector: 'dx-accordion[dxSelectedIndex]', exportAs: 'dxSelectedIndex' })
export class DxAccordionSelectedIndexDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxSelectedIndexDirectiveBase<DxAccordionComponent<TItem, TKey>> {
    constructor() {
        super(inject(DxAccordionComponent, { self: true }), 'selectedIndex');
    }
}

/** `[(dxSelectedIndex)]` for `dx-gallery`. */
@Directive({ selector: 'dx-gallery[dxSelectedIndex]', exportAs: 'dxSelectedIndex' })
export class DxGallerySelectedIndexDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxSelectedIndexDirectiveBase<DxGalleryComponent<TItem, TKey>> {
    constructor() {
        super(inject(DxGalleryComponent, { self: true }), 'selectedIndex');
    }
}

/** `[(dxSelectedItemKeys)]` for `dx-list` (works with any `selectionMode`). */
@Directive({ selector: 'dx-list[dxSelectedItemKeys]', exportAs: 'dxSelectedItemKeys' })
export class DxListSelectedItemKeysDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxSelectedItemKeysDirectiveBase<DxListComponent<TItem, TKey>, TKey> {
    constructor() {
        super(inject(DxListComponent, { self: true }), 'selectedItemKeys');
    }
}

/** `[(dxOpened)]` for `dx-drawer`. */
@Directive({ selector: 'dx-drawer[dxOpened]', exportAs: 'dxOpened' })
export class DxDrawerOpenedDirective extends DxBindingDirectiveBase {
    readonly dxOpened = model.required<boolean>();

    constructor() {
        super();
        this.bindOption<DxDrawerComponent, boolean>(
            inject(DxDrawerComponent, { self: true }),
            'opened',
            this.dxOpened,
        );
    }
}

/** All navigation adapter directives, for convenient bulk import. */
export const DX_NAVIGATION_DIRECTIVES = [
    DxAccordionSelectedIndexDirective,
    DxDrawerOpenedDirective,
    DxGallerySelectedIndexDirective,
    DxListSelectedItemKeysDirective,
    DxTabPanelSelectedIndexDirective,
    DxTabsSelectedIndexDirective,
] as const;
