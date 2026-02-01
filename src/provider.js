import { Container } from "./container.js";
import { AsyncContainer } from "./async-container.js";
import { createSyncCompiledResolver, createAsyncCompiledResolver } from "./compiled-resolver.js";
import {
  createSyncInterpretedResolver,
  createAsyncInterpretedResolver,
} from "./interpreted-resolver.js";
import { isArray, isFunction, isUndefined, isPlainObject, isBoolean } from "./type-guards.js";
import {
  CyclicDependencyError,
  MissingProviderError,
  ScopeViolationError,
  ProviderArgumentsError,
  ProviderOverrideError,
} from "./errors.js";
import { nameOf } from "./format.js";

const Scope = Object.freeze({
  APP: 4,
  REQUEST: 3,
  ACTION: 2,
  STEP: 1,
});

const ContainerType = Object.freeze({
  SYNC: "sync",
  ASYNC: "async",
});

const Mode = Object.freeze({
  SAFE: "safe",
  FAST: "fast",
});

class SafeResolverFactory {
  getSyncResolverBuilder() {
    return createSyncInterpretedResolver;
  }

  getAsyncResolverBuilder() {
    return createAsyncInterpretedResolver;
  }
}

class FastResolverFactory {
  getSyncResolverBuilder() {
    return createSyncCompiledResolver;
  }

  getAsyncResolverBuilder() {
    return createAsyncCompiledResolver;
  }
}

function getResolverFactory(mode) {
  switch (mode) {
    case Mode.SAFE:
      return new SafeResolverFactory();
    case Mode.FAST:
      return new FastResolverFactory();
    default:
      throw new Error(`unknown mode: ${mode}`);
  }
}

function normalizeProvide(arg1, arg2, arg3) {
  let deps = [];
  let factory;
  const opts = { override: false };

  const kind = (x) => {
    if (isArray(x)) return "deps";
    if (isFunction(x)) return "factory";
    if (isPlainObject(x)) return "opts";
    if (isUndefined(x)) return "undef";
    return "other";
  };

  const signature = `${kind(arg1)}:${kind(arg2)}:${kind(arg3)}`;

  switch (signature) {
    case "deps:factory:opts":
      deps = arg1;
      factory = arg2;
      Object.assign(opts, arg3);
      break;

    case "deps:factory:undef":
      deps = arg1;
      factory = arg2;
      break;

    case "deps:opts:undef":
      deps = arg1;
      Object.assign(opts, arg2);
      break;

    case "deps:undef:undef":
      deps = arg1;
      break;

    case "factory:opts:undef":
      factory = arg1;
      Object.assign(opts, arg2);
      break;

    case "factory:undef:undef":
      factory = arg1;
      break;

    case "opts:undef:undef":
      Object.assign(opts, arg1);
      break;

    case "undef:undef:undef":
      break;

    default:
      throw new ProviderArgumentsError();
  }

  if (!isBoolean(opts.override)) {
    throw new TypeError("options.override must be boolean");
  }

  return { deps, factory, ...opts };
}

class Provider {
  #scope;
  #bindings;

  constructor(scope) {
    this.#scope = scope;
    this.#bindings = [];
  }

  provide(key, depsOrFactoryOrOpts, factoryOrOpts, maybeOpts) {
    const { deps, factory, override } = normalizeProvide(
      depsOrFactoryOrOpts,
      factoryOrOpts,
      maybeOpts,
    );

    this.#bindings.push({
      key,
      factory,
      deps,
      override,
    });
  }

  applyTo(graph, buildResolver) {
    for (const { key, deps, factory, override } of this.#bindings) {
      if (graph.has(key) && !override) {
        throw new ProviderOverrideError(key);
      }

      const resolve = buildResolver(factory, deps, key);
      graph.set(key, {
        resolve,
        deps,
        scope: this.#scope,
      });
    }
  }
}

function formatCyclePath(path, key) {
  const stack = [...path];
  const start = stack.indexOf(key);
  const cycle = stack.slice(start).concat(key).map(nameOf);
  return cycle.join(" > ");
}

function checkGraphIntegrity(graph) {
  const visited = new Set();
  const path = new Set();

  function step(key, parentScope = null) {
    if (path.has(key)) {
      throw new CyclicDependencyError(formatCyclePath(path, key));
    }

    const node = graph.get(key);
    if (!node) {
      throw new MissingProviderError(key);
    }

    if (parentScope !== null && node.scope < parentScope) {
      throw new ScopeViolationError(key);
    }

    if (visited.has(key)) {
      return;
    }

    path.add(key);

    for (const dep of node.deps) {
      step(dep, node.scope);
    }

    visited.add(key);
    path.delete(key);
  }

  for (const key of graph.keys()) {
    step(key);
  }
}

function makeContainer(scope, providers, containerType, mode) {
  const resolverFactory = getResolverFactory(mode);
  const buildResolver =
    containerType === ContainerType.SYNC
      ? resolverFactory.getSyncResolverBuilder()
      : resolverFactory.getAsyncResolverBuilder();

  const graph = new Map();
  for (const provider of providers) {
    provider.applyTo(graph, buildResolver);
  }

  checkGraphIntegrity(graph);

  return containerType === ContainerType.SYNC
    ? new Container(scope, graph)
    : new AsyncContainer(scope, graph);
}

function makeAsyncContainer(scope, providers, mode = Mode.SAFE) {
  return makeContainer(scope, providers, ContainerType.ASYNC, mode);
}

function makeSyncContainer(scope, providers, mode = Mode.SAFE) {
  return makeContainer(scope, providers, ContainerType.SYNC, mode);
}

export { Scope, Provider, Mode, makeSyncContainer, makeAsyncContainer };
