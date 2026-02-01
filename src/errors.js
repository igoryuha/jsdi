import { nameOf } from "./format.js";

class CyclicDependencyError extends Error {
  constructor(cyclePath) {
    super(`cyclic dependency detected: ${cyclePath}`);
    this.name = this.constructor.name;
  }
}

class MissingProviderError extends Error {
  constructor(key) {
    super(`missing provider for ${nameOf(key)}`);
    this.name = this.constructor.name;
  }
}

class ScopeViolationError extends Error {
  constructor(key) {
    super(`dependency on nested scope for ${nameOf(key)}`);
    this.name = this.constructor.name;
  }
}

class ProviderArgumentsError extends Error {
  constructor() {
    super(
      "Invalid provide(...) arguments. Allowed:\n" +
        "  provide(key)\n" +
        "  provide(key, depends[])\n" +
        "  provide(key, factory)\n" +
        "  provide(key, options)\n" +
        "  provide(key, depends[], factory)\n" +
        "  provide(key, depends[], options)\n" +
        "  provide(key, factory, options)\n" +
        "  provide(key, depends[], factory, options)",
    );
    this.name = this.constructor.name;
  }
}

class ProviderOverrideError extends Error {
  constructor(key) {
    super(
      `Duplicate provider for key "${nameOf(key)}". ` +
        `A provider is already registered. ` +
        `If you intended to replace it, pass { override: true }.`,
    );
    this.name = this.constructor.name;
  }
}

export {
  CyclicDependencyError,
  MissingProviderError,
  ScopeViolationError,
  ProviderArgumentsError,
  ProviderOverrideError,
};
