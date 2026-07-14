/**
 * Structural equality used to break the two-way binding echo cycle
 * (signal → widget → `optionChanged` → signal → ...).
 *
 * DevExtreme frequently emits *new* array/object references for unchanged
 * data (e.g. `selectedRowKeys`), so reference equality alone would loop.
 */

/** Custom equality comparer for a bound value. */
export type DxEqualityFn<in T> = (a: T, b: T) => boolean;

/**
 * Deep structural equality with special handling for `Date` and arrays.
 * Plain objects are compared by their own enumerable keys; class instances
 * (anything with a custom prototype) fall back to reference equality.
 */
export function dxStructuralEquals(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) {
        return true;
    }
    if (a instanceof Date || b instanceof Date) {
        return (
            a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
        );
    }
    if (Array.isArray(a) || Array.isArray(b)) {
        return (
            Array.isArray(a) &&
            Array.isArray(b) &&
            a.length === b.length &&
            a.every((item, index) => dxStructuralEquals(item, b[index]))
        );
    }
    if (isPlainObject(a) && isPlainObject(b)) {
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        return (
            aKeys.length === bKeys.length &&
            aKeys.every(
                (key) =>
                    Object.prototype.hasOwnProperty.call(b, key) &&
                    dxStructuralEquals(a[key], b[key]),
            )
        );
    }
    return false;
}

/** Shallow equality over the own enumerable keys of two plain objects. */
export function dxShallowObjectEquals(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) {
        return true;
    }
    if (!isPlainObject(a) || !isPlainObject(b)) {
        return false;
    }
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    return (
        aKeys.length === bKeys.length &&
        aKeys.every(
            (key) =>
                Object.prototype.hasOwnProperty.call(b, key) &&
                Object.is(a[key], b[key]),
        )
    );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const proto: unknown = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}
