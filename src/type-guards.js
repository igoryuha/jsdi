const objToString = Object.prototype.toString;

export function isGeneratorFunction(fn) {
  return typeof fn === "function" && objToString.call(fn) === "[object GeneratorFunction]";
}

export function isAsyncFunction(fn) {
  return typeof fn === "function" && objToString.call(fn) === "[object AsyncFunction]";
}

export function isAsyncGeneratorFunction(fn) {
  return typeof fn === "function" && objToString.call(fn) === "[object AsyncGeneratorFunction]";
}

export function isAsyncCallable(fn) {
  if (typeof fn !== "function") return false;
  const tag = objToString.call(fn);
  return tag === "[object AsyncFunction]" || tag === "[object AsyncGeneratorFunction]";
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

export function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

export function isBoolean(value) {
  return typeof value === "boolean";
}

export function isPromise(value) {
  return value != null && typeof value.then === "function";
}
