import { Directive, input, model } from '@angular/core';
import type { DxAccordionComponent } from 'devextreme-angular/ui/accordion';
import type { DxButtonGroupComponent } from 'devextreme-angular/ui/button-group';
import type { DxDrawerComponent } from 'devextreme-angular/ui/drawer';
import type { DxDropDownButtonComponent } from 'devextreme-angular/ui/drop-down-button';
import type { DxGalleryComponent } from 'devextreme-angular/ui/gallery';
import type { DxListComponent } from 'devextreme-angular/ui/list';
import type { DxMultiViewComponent } from 'devextreme-angular/ui/multi-view';
import type { DxPaginationComponent } from 'devextreme-angular/ui/pagination';
import type { DxResizableComponent } from 'devextreme-angular/ui/resizable';
import type { DxSplitterComponent } from 'devextreme-angular/ui/splitter';
import type { DxStepperComponent } from 'devextreme-angular/ui/stepper';
import type { DxTabPanelComponent } from 'devextreme-angular/ui/tab-panel';
import type { DxTabsComponent } from 'devextreme-angular/ui/tabs';
import {
    DxBindingDirectiveBase,
    DxOpenedDirectiveBase,
    DxSelectedIndexDirectiveBase,
    DxSelectedItemKeysDirectiveBase,
    injectDxHost,
    type DxBindingAdapter,
    type DxHostOptionValue,
    type DxInstanceOf,
    type DxOptionChangedArgs,
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

/* ------------------------------------------------------------------------ *
 *  Layout state (4.0): the resizable's dimensions and the splitter's panes.
 * ------------------------------------------------------------------------ */

/** A dimension as `dx-resizable` declares `width`/`height`: pixels as a number, or a CSS length. */
export type DxResizableSize = Exclude<DxHostOptionValue<DxResizableComponent, 'width'>, undefined>;

/**
 * `[(dxWidth)]` for `dx-resizable` — the element's width on a signal. The
 * widget writes `width` through its regular option setter on *every* pointer
 * move of a drag (verified against 26.1.4: `_updateDimensions` →
 * `option({ width })`), so the signal follows the drag live; debounce the
 * widget → signal direction with `dxWidthDebounce` if that is too much. A
 * written value is applied through the standard dimension pipeline.
 */
@Directive({ selector: 'dx-resizable[dxWidth]', exportAs: 'dxWidth' })
export class DxResizableWidthDirective extends DxBindingDirectiveBase {
    readonly dxWidth = model.required<DxResizableSize>();
    readonly dxWidthDebounce = input(0);

    constructor() {
        super();
        this.bindOption<DxResizableComponent, DxResizableSize>(
            injectDxHost<DxResizableComponent>(),
            'width',
            this.dxWidth,
            { debounceMs: () => this.dxWidthDebounce() },
        );
    }
}

/** `[(dxHeight)]` for `dx-resizable` — see {@link DxResizableWidthDirective}. */
@Directive({ selector: 'dx-resizable[dxHeight]', exportAs: 'dxHeight' })
export class DxResizableHeightDirective extends DxBindingDirectiveBase {
    readonly dxHeight = model.required<DxResizableSize>();
    readonly dxHeightDebounce = input(0);

    constructor() {
        super();
        this.bindOption<DxResizableComponent, DxResizableSize>(
            injectDxHost<DxResizableComponent>(),
            'height',
            this.dxHeight,
            { debounceMs: () => this.dxHeightDebounce() },
        );
    }
}

/* Structural view of a splitter pane as read back through `option('items')`. */
interface SplitterItemLike {
    readonly size?: number | string;
    readonly collapsed?: boolean;
}

function splitterItems(instance: { option(name: string): unknown }): readonly SplitterItemLike[] {
    return (instance.option('items') as readonly SplitterItemLike[] | undefined) ?? [];
}

/**
 * `[(dxItemSizes)]` for `dx-splitter` — the panes' sizes in pixels, one entry
 * per item, so a layout the user dragged can be persisted and restored:
 *
 * ```html
 * <dx-splitter [(dxItemSizes)]="sizes" [(dxCollapsedItems)]="collapsed">
 *   <dxi-item text="left" [collapsible]="true" />
 *   <dxi-item text="right" />
 * </dx-splitter>
 * ```
 *
 * The splitter is the one widget in this catalog whose write-back is
 * *silent*: at the end of a drag it re-measures every pane and stores the
 * pixel size into `items[i].size` through `Options.silent()`, which raises no
 * `optionChanged` (verified against 26.1.4; the live drag only touches CSS).
 * The adapter therefore listens to `resizeEnd`, which fires right after that
 * store, to `itemCollapsed`/`itemExpanded` (a collapse re-measures too), to the
 * `items` option change and to `contentReady`, and reads `option('items')`.
 * A written size is applied and then re-measured — silently again — so the
 * adapter re-reads after each write and the signal converges to the layout
 * the splitter actually produced.
 *
 * Sizes are known only once the splitter has laid out: before that the
 * signal is `undefined`, and `undefined` means "do not push". Only pixel
 * numbers are modelled; a `'30%'` configured on an item is what the widget
 * itself replaces with pixels on first layout.
 */
@Directive({ selector: 'dx-splitter[dxItemSizes]', exportAs: 'dxItemSizes' })
export class DxSplitterItemSizesDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxBindingDirectiveBase {
    readonly dxItemSizes = model.required<readonly number[] | undefined>();

    constructor() {
        super();
        type TInstance = DxInstanceOf<DxSplitterComponent<TItem, TKey>>;
        const adapter: DxBindingAdapter<TInstance, readonly number[] | undefined> = {
            events: ['resizeEnd', 'itemCollapsed', 'itemExpanded', 'optionChanged', 'contentReady'],
            reReadAfterWrite: true,
            read: (instance) => {
                const sizes = splitterItems(instance).map((item) => item.size);
                return sizes.every((size): size is number => typeof size === 'number')
                    ? sizes
                    : undefined;
            },
            write: (instance, sizes) => {
                if (sizes === undefined) {
                    return;
                }
                const items = splitterItems(instance);
                sizes.forEach((size, index) => {
                    if (index < items.length && items[index]?.size !== size) {
                        (instance.option as (name: string, value: unknown) => void)(
                            `items[${index}].size`,
                            size,
                        );
                    }
                });
            },
            accept: (eventName, eventArgs) =>
                eventName !== 'optionChanged' ||
                (eventArgs as DxOptionChangedArgs).name === 'items',
        };
        this.bindAdapter<DxSplitterComponent<TItem, TKey>, readonly number[] | undefined>(
            injectDxHost<DxSplitterComponent>(),
            this.dxItemSizes,
            adapter,
        );
    }
}

/**
 * `[(dxCollapsedItems)]` for `dx-splitter` — the indexes of the collapsed
 * panes as a complete set: writing `[0]` collapses the first pane and expands
 * every other, `[]` expands all. A pane needs `collapsible: true` for the
 * user to toggle it; the option is written either way. The collapse handle
 * writes `items[i].collapsed` through the regular setter (unlike the sizes),
 * so `optionChanged` on `items` plus the `itemCollapsed`/`itemExpanded`
 * events, which fire after the widget has applied the change, are the whole
 * set. See {@link DxSplitterItemSizesDirective} for the template.
 */
@Directive({ selector: 'dx-splitter[dxCollapsedItems]', exportAs: 'dxCollapsedItems' })
export class DxSplitterCollapsedItemsDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxBindingDirectiveBase {
    readonly dxCollapsedItems = model.required<readonly number[]>();

    constructor() {
        super();
        type TInstance = DxInstanceOf<DxSplitterComponent<TItem, TKey>>;
        const adapter: DxBindingAdapter<TInstance, readonly number[]> = {
            events: ['itemCollapsed', 'itemExpanded', 'optionChanged'],
            read: (instance) =>
                splitterItems(instance).flatMap((item, index) => (item.collapsed === true ? [index] : [])),
            write: (instance, collapsed) => {
                splitterItems(instance).forEach((item, index) => {
                    const wanted = collapsed.includes(index);
                    if ((item.collapsed === true) !== wanted) {
                        (instance.option as (name: string, value: unknown) => void)(
                            `items[${index}].collapsed`,
                            wanted,
                        );
                    }
                });
            },
            accept: (eventName, eventArgs) =>
                eventName !== 'optionChanged' ||
                (eventArgs as DxOptionChangedArgs).name === 'items',
        };
        this.bindAdapter<DxSplitterComponent<TItem, TKey>, readonly number[]>(
            injectDxHost<DxSplitterComponent>(),
            this.dxCollapsedItems,
            adapter,
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
    DxResizableHeightDirective,
    DxResizableWidthDirective,
    DxSplitterCollapsedItemsDirective,
    DxSplitterItemSizesDirective,
    DxStepperSelectedIndexDirective,
    DxTabPanelSelectedIndexDirective,
    DxTabsSelectedIndexDirective,
    DxTabsSelectedItemKeysDirective,
] as const;
