import { nameOf } from "./format.js";

class CyclicDependencyError extends Error {
  constructor(cyclePath) {
    super(`cyclic dependency detected: ${cyclePath}`);
  }
}

class MissingProviderError extends Error {
  constructor(key) {
    super(`missing provider for ${nameOf(key)}`);
  }
}

class ScopeViolationError extends Error {
  constructor(key) {
    super(`dependency on nested scope for ${nameOf(key)}`);
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
  }
}

class ProviderOverrideError extends Error {
  constructor(key) {
    super(
      `Duplicate provider for key "${nameOf(key)}". ` +
        `A provider is already registered. ` +
        `If you intended to replace it, pass { override: true }.`,
    );
  }
}

class KeyNotRegisteredError extends Error {
  constructor(key) {
    super(`Key is not registered in this container: ${nameOf(key)}`);
  }
}

class OutOfScopeResolutionError extends Error {
  constructor(key, registeredScope) {
    super(
      `Cannot resolve ${nameOf(key)}: the key is registered in a narrower scope (${registeredScope}) ` +
        `and cannot be resolved from a wider scope. No parent container is available for delegation.`,
    );
  }
}

class InvalidCleanupGeneratorError extends Error {
  constructor() {
    super("Invalid cleanup generator: it must yield exactly once");
  }
}

class ContainerCleanupError extends AggregateError {
  constructor(errors) {
    super(errors, "One or more cleanup handlers failed");
  }
}

class InvalidScopeTransitionError extends Error {
  constructor(scope, targetScope) {
    super(
      `Cannot enter scope ${targetScope} from scope ${scope}: ` +
        `containers may only create nested (narrower) scopes`,
    );
  }
}

class UnknownModeError extends Error {
  constructor(mode) {
    super(`Unknown container mode: ${mode}. Expected one of: safe, fast`);
  }
}

class InvalidProvideOptionsError extends Error {
  constructor(optionName, expectedType) {
    super(`Invalid provider options: "${optionName}" must be ${expectedType}.`);
  }
}

export {
  CyclicDependencyError,
  MissingProviderError,
  ScopeViolationError,
  ProviderArgumentsError,
  ProviderOverrideError,
  KeyNotRegisteredError,
  OutOfScopeResolutionError,
  InvalidCleanupGeneratorError,
  ContainerCleanupError,
  InvalidScopeTransitionError,
  UnknownModeError,
  InvalidProvideOptionsError,
};
