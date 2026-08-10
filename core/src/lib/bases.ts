import { Directive, input, model, untracked, type WritableSignal } from '@angular/core';
import {
    bindDxState,
    dxOptionAdapter,
    type DxBindingAdapter,
    type DxBindingOptions,
} from './binding';
import { dxStructuralEquals, type DxEqualityFn } from './equality';
import type {
    DxHostComponent,
    DxHostOptionName,
    DxInstanceOf,
} from './types';

/**
 * Abstract base directives for the concrete per-component adapter directives.
 *
 * Each family declares one `model()` whose field name doubles as the binding
 * name (`[(dxValue)]`, `[(dxSelectedRowKeys)]`, ...). Concrete directives only
 * inject their host component and name the widget option — the option name is
 * type-checked against the widget's `Properties`, so a typo or an option that
 * does not exist on that widget fails to compile.
 */

/** Shared plumbing: attaches the family model to a widget option or custom adapter. */
@Directive()
export abstract class DxBindingDirectiveBase {
    protected bindOption<THost extends DxHostComponent, TValue>(
        host: THost,
        optionName: DxHostOptionName<THost>,
        source: WritableSignal<TValue>,
        options?: DxBindingOptions<TValue>,
    ): void {
        bindDxState(
            host,
            source,
            dxOptionAdapter<THost, DxHostOptionName<THost>, TValue>(optionName),
            options,
        );
    }

    protected bindAdapter<THost extends DxHostComponent, TValue>(
        host: THost,
        source: WritableSignal<TValue>,
        adapter: DxBindingAdapter<DxInstanceOf<THost>, TValue>,
        options?: DxBindingOptions<TValue>,
    ): void {
        bindDxState(host, source, adapter, options);
    }
}

/**
 * `[(dxValue)]` — two-way binds an editor's `value` option to a signal.
 * Also exposes:
 *  - `dxValueDebounce`: debounce (ms) for the widget → signal direction,
 *  - `dxValueEqual`: custom equality to suppress echo updates.
 */
@Directive()
export abstract class DxValueDirectiveBase<
    THost extends DxHostComponent,
    TValue,
> extends DxBindingDirectiveBase {
    readonly dxValue = model.required<TValue>();
    readonly dxValueDebounce = input(0);
    readonly dxValueEqual = input<DxEqualityFn<TValue> | undefined>(undefined);

    protected constructor(host: THost, optionName: DxHostOptionName<THost>) {
        super();
        this.bindOption<THost, TValue>(host, optionName, this.dxValue, {
            debounceMs: () => this.dxValueDebounce(),
            equal: (a, b) => (untracked(this.dxValueEqual) ?? dxStructuralEquals)(a, b),
        });
    }
}

/** `[(dxSelectedRowKeys)]` / `[(dxSelectedItemKeys)]`-style multi-selection bases. */
@Directive()
export abstract class DxSelectedRowKeysDirectiveBase<
    THost extends DxHostComponent,
    TKey,
> extends DxBindingDirectiveBase {
    readonly dxSelectedRowKeys = model.required<readonly TKey[]>();

    protected constructor(host: THost, optionName: DxHostOptionName<THost>) {
        super();
        this.bindOption<THost, readonly TKey[]>(host, optionName, this.dxSelectedRowKeys);
    }
}

@Directive()
export abstract class DxSelectedItemKeysDirectiveBase<
    THost extends DxHostComponent,
    TKey,
> extends DxBindingDirectiveBase {
    readonly dxSelectedItemKeys = model.required<readonly TKey[]>();

    protected constructor(host: THost, optionName: DxHostOptionName<THost>) {
        super();
        this.bindOption<THost, readonly TKey[]>(host, optionName, this.dxSelectedItemKeys);
    }
}

/** `[(dxSelectedIndex)]` — for index-based navigation widgets (Tabs, TabPanel, ...). */
@Directive()
export abstract class DxSelectedIndexDirectiveBase<
    THost extends DxHostComponent,
> extends DxBindingDirectiveBase {
    readonly dxSelectedIndex = model.required<number>();

    protected constructor(host: THost, optionName: DxHostOptionName<THost>) {
        super();
        this.bindOption<THost, number>(host, optionName, this.dxSelectedIndex);
    }
}

/** `[(dxVisible)]` — for overlay widgets (Popup, Popover, Toast, ...). */
@Directive()
export abstract class DxVisibleDirectiveBase<
    THost extends DxHostComponent,
> extends DxBindingDirectiveBase {
    readonly dxVisible = model.required<boolean>();

    protected constructor(host: THost, optionName: DxHostOptionName<THost>) {
        super();
        this.bindOption<THost, boolean>(host, optionName, this.dxVisible);
    }
}
