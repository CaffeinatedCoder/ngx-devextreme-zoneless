import {
    Directive,
    input,
    model,
    untracked,
    type Signal,
} from '@angular/core';
import type { DxChartComponent } from 'devextreme-angular/ui/chart';
import type { DxPieChartComponent } from 'devextreme-angular/ui/pie-chart';
import type { DxPolarChartComponent } from 'devextreme-angular/ui/polar-chart';
import type { DxRangeSelectorComponent } from 'devextreme-angular/ui/range-selector';
import {
    DxBindingDirectiveBase,
    DxValueDirectiveBase,
    dxStructuralEquals,
    injectDxHost,
    onDxWidgetReady,
    type DxAdapterEventName,
    type DxBindingAdapter,
    type DxHostComponent,
    type DxHostOptionValue,
    type DxHostValue,
    type DxInstanceOf,
    type DxOptionChangedArgs,
    type DxWidget,
} from 'ngx-devextreme-zoneless/core';

/** An argument/value as used by chart points. */
export type DxChartPointValue = string | number | Date;

/**
 * A serializable descriptor of a selected chart point — deliberately *not*
 * the live `Point` object, so it can be stored, compared and restored.
 */
export interface DxChartSelectedPoint {
    readonly seriesName?: string;
    readonly argument: DxChartPointValue | undefined;
    readonly value: DxChartPointValue | undefined;
}

/* Structural view of the chart APIs shared by dxChart and dxPieChart. */
interface ChartPointLike {
    readonly originalArgument?: DxChartPointValue;
    readonly originalValue?: DxChartPointValue;
    select(): void;
    clearSelection(): void;
    isSelected(): boolean;
}
interface ChartSeriesLike {
    name?: unknown;
    getAllPoints(): ChartPointLike[];
    getPointsByArg(pointArg: DxChartPointValue): ChartPointLike[];
}
interface ChartLike {
    getAllSeries(): ChartSeriesLike[];
    clearSelection(): void;
}

function chartSelectionAdapter<TInstance extends DxWidget & ChartLike>(): DxBindingAdapter<
    TInstance,
    readonly DxChartSelectedPoint[]
> {
    return {
        // `pointSelectionChanged` exists on every chart-family widget; the
        // cast is only needed because `TInstance` is an unresolved type
        // parameter here. The name is pinned as a positive control in
        // `examples/type-tests.ts`, so a DevExtreme rename still fails CI.
        events: ['pointSelectionChanged'] as unknown as readonly DxAdapterEventName<TInstance>[],
        // A descriptor matching no point is silently skipped by `write` below,
        // and the selection events the chart fires during our own write are
        // dropped by the engine's re-entrancy latch — so without this the
        // signal keeps selections the chart never made, and structural
        // equality then suppresses the read that would reconcile them. Same
        // partial-rejection class as TreeView's `selectItem`.
        reReadAfterWrite: true,
        read: (instance) =>
            instance.getAllSeries().flatMap((series) =>
                series
                    .getAllPoints()
                    .filter((point) => point.isSelected())
                    .map(
                        (point): DxChartSelectedPoint => ({
                            seriesName: typeof series.name === 'string' ? series.name : undefined,
                            argument: point.originalArgument,
                            value: point.originalValue,
                        }),
                    ),
            ),
        write: (instance, descriptors) => {
            instance.beginUpdate();
            try {
                instance.clearSelection();
                const allSeries = instance.getAllSeries();
                for (const descriptor of descriptors) {
                    const candidates =
                        descriptor.seriesName === undefined
                            ? allSeries
                            : allSeries.filter((series) => series.name === descriptor.seriesName);
                    for (const series of candidates) {
                        if (descriptor.argument === undefined) {
                            continue;
                        }
                        for (const point of series.getPointsByArg(descriptor.argument)) {
                            if (
                                descriptor.value === undefined ||
                                dxStructuralEquals(point.originalValue, descriptor.value)
                            ) {
                                point.select();
                            }
                        }
                    }
                }
            } finally {
                instance.endUpdate();
            }
        },
    };
}

/**
 * DevExtreme charts do **not** select points on click by themselves — their
 * own demos wire `onPointClick: (e) => e.target.select()` manually (the
 * hatched look on plain hover is the *hover* style, easily mistaken for
 * selection). Because a two-way selection binding without click support
 * would be surprising, the `[(dxSelectedPoints)]` directives toggle the
 * clicked point's selection by default; disable via
 * `[dxPointClickToggle]="false"` to handle `onPointClick` yourself.
 */
function attachPointClickToggle<THost extends DxHostComponent>(
    host: THost,
    enabled: Signal<boolean>,
): void {
    onDxWidgetReady(host, (instance) => {
        const handler = (eventArgs: unknown): void => {
            if (!untracked(enabled)) {
                return;
            }
            const point = (eventArgs as { target?: ChartPointLike }).target;
            if (point === undefined || typeof point.select !== 'function') {
                return;
            }
            if (point.isSelected()) {
                point.clearSelection();
            } else {
                point.select();
            }
        };
        instance.on('pointClick', handler);
        return () => instance.off('pointClick', handler);
    });
}

/**
 * `[(dxSelectedPoints)]` base shared by the chart-family widgets — two-way
 * binds the selected points to a signal as serializable descriptors, and wires
 * the click-to-toggle behaviour DevExtreme leaves to the consumer.
 *
 * Set `pointSelectionMode="multiple"` on a `dx-chart` to allow more than one
 * selected point. Clicking a point toggles its selection unless
 * `[dxPointClickToggle]="false"`.
 */
@Directive()
export abstract class DxSelectedPointsDirectiveBase<
    THost extends DxHostComponent<DxWidget & ChartLike>,
> extends DxBindingDirectiveBase {
    readonly dxSelectedPoints = model.required<readonly DxChartSelectedPoint[]>();
    readonly dxPointClickToggle = input(true);

    protected constructor(host: THost) {
        super();
        this.bindAdapter<THost, readonly DxChartSelectedPoint[]>(
            host,
            this.dxSelectedPoints,
            // The `THost` constraint guarantees the instance shape; the cast
            // bridges TS's inability to prove it for an unresolved parameter.
            chartSelectionAdapter<DxWidget & ChartLike>() as DxBindingAdapter<
                DxInstanceOf<THost>,
                readonly DxChartSelectedPoint[]
            >,
        );
        attachPointClickToggle(host, this.dxPointClickToggle);
    }
}

/** `[(dxSelectedPoints)]` for `dx-chart` — see {@link DxSelectedPointsDirectiveBase}. */
@Directive({ selector: 'dx-chart[dxSelectedPoints]', exportAs: 'dxSelectedPoints' })
export class DxChartSelectedPointsDirective extends DxSelectedPointsDirectiveBase<DxChartComponent> {
    constructor() {
        super(injectDxHost<DxChartComponent>());
    }
}

/** `[(dxSelectedPoints)]` for `dx-pie-chart` — see {@link DxSelectedPointsDirectiveBase}. */
@Directive({ selector: 'dx-pie-chart[dxSelectedPoints]', exportAs: 'dxSelectedPoints' })
export class DxPieChartSelectedPointsDirective extends DxSelectedPointsDirectiveBase<DxPieChartComponent> {
    constructor() {
        super(injectDxHost<DxPieChartComponent>());
    }
}

/** `[(dxSelectedPoints)]` for `dx-polar-chart` — the point-selection API lives on the shared chart base. */
@Directive({ selector: 'dx-polar-chart[dxSelectedPoints]', exportAs: 'dxSelectedPoints' })
export class DxPolarChartSelectedPointsDirective extends DxSelectedPointsDirectiveBase<DxPolarChartComponent> {
    constructor() {
        super(injectDxHost<DxPolarChartComponent>());
    }
}

/** The argument axis' visual range, as `dx-chart` declares it. */
export type DxChartVisualRange = NonNullable<
    NonNullable<DxHostOptionValue<DxChartComponent, 'argumentAxis'>>['visualRange']
>;

/**
 * `[(dxVisualRange)]` for `dx-chart` — two-way binds the argument axis'
 * visual range, which is what user zoom and pan change, so several charts
 * can share one window or a range can be persisted and restored:
 *
 * ```html
 * <dx-chart [(dxVisualRange)]="window" [dataSource]="data">
 *   <dxo-zoom-and-pan argumentAxis="both" [allowMouseWheel]="true" />
 * </dx-chart>
 * ```
 *
 * `argumentAxis.visualRange` is a nested option, so this is a method-based
 * adapter; the chart writes it back through the regular option setter on
 * every zoom/pan (`_notifyVisualRange` → `option('argumentAxis.visualRange', …)`,
 * verified against 26.1.4), so `optionChanged` filtered on `argumentAxis`
 * plus `zoomEnd` is the complete set. The chart normalizes what it is handed
 * — a `[start, end]` array is read back as `{ startValue, endValue }` — so
 * the adapter re-reads after each write and the signal converges to the
 * chart's representation. Once rendered, the chart reports the *full* data
 * range through the same setter (measured: `{ startValue: 1, endValue: 10 }`
 * on a 1..10 axis before any zoom), so the signal is only `undefined` before
 * the first render — and `undefined` means "do not push", per the engine rule.
 */
@Directive({ selector: 'dx-chart[dxVisualRange]', exportAs: 'dxVisualRange' })
export class DxChartVisualRangeDirective extends DxBindingDirectiveBase {
    readonly dxVisualRange = model.required<DxChartVisualRange | undefined>();
    readonly dxVisualRangeDebounce = input(0);

    constructor() {
        super();
        const adapter: DxBindingAdapter<DxInstanceOf<DxChartComponent>, DxChartVisualRange | undefined> = {
            events: ['optionChanged', 'zoomEnd'],
            reReadAfterWrite: true,
            read: (instance) =>
                (instance.option as (name: string) => unknown)('argumentAxis.visualRange') as
                    | DxChartVisualRange
                    | undefined,
            write: (instance, range) => {
                (instance.option as (name: string, value: unknown) => void)(
                    'argumentAxis.visualRange',
                    range,
                );
            },
            accept: (eventName, eventArgs) =>
                eventName !== 'optionChanged' ||
                (eventArgs as DxOptionChangedArgs).name === 'argumentAxis',
        };
        this.bindAdapter<DxChartComponent, DxChartVisualRange | undefined>(
            injectDxHost<DxChartComponent>(),
            this.dxVisualRange,
            adapter,
            { debounceMs: () => this.dxVisualRangeDebounce() },
        );
    }
}

/** The scale range type of `dx-range-selector`, as declared by DevExtreme. */
export type DxRangeSelectorValue = DxHostValue<DxRangeSelectorComponent>;

/** `[(dxValue)]` for `dx-range-selector`. */
@Directive({ selector: 'dx-range-selector[dxValue]', exportAs: 'dxValue' })
export class DxRangeSelectorValueDirective extends DxValueDirectiveBase<
    DxRangeSelectorComponent,
    DxRangeSelectorValue
> {
    constructor() {
        super(injectDxHost<DxRangeSelectorComponent>(), 'value');
    }
}

/** All visualization adapter directives, for convenient bulk import. */
export const DX_VISUALIZATION_DIRECTIVES = [
    DxChartSelectedPointsDirective,
    DxChartVisualRangeDirective,
    DxPieChartSelectedPointsDirective,
    DxPolarChartSelectedPointsDirective,
    DxRangeSelectorValueDirective,
] as const;
