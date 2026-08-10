/**
 * Shared editor value-type aliases used across the directive families
 * (editors, data, visualization).
 */

/** A date-like value as accepted by DevExtreme date editors. */
export type DxDateValue = Date | number | string;

/** A date range as held by `dx-date-range-box`. */
export type DxDateRange = readonly [start: DxDateValue | null, end: DxDateValue | null];

/** A numeric range as held by `dx-range-slider`. */
export type DxNumberRange = readonly [start: number, end: number];

/** A filter expression as held by `dx-filter-builder` and grid `filterValue` options. */
export type DxFilterExpression =
    | string
    | readonly unknown[]
    | ((...args: never[]) => unknown);
