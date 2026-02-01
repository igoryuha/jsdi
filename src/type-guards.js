export function isGenerator(fn) {
    return typeof fn === "function" && fn.constructor?.name === "GeneratorFunction";
}

export function isArray(value) {
    return Array.isArray(value);
}

export function isFunction(value) {
    return typeof value === "function";
}

export function isUndefined(value) {
    return value === undefined;
}
