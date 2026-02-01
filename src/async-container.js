import { isFunction } from "./type-guards.js";
import { OutOfScopeResolutionError } from "./errors.js";
import {
  InvalidCleanupGeneratorError,
  ContainerCleanupError,
  KeyNotRegisteredError,
  InvalidScopeTransitionError,
} from "./errors.js";

class AsyncContainer {
  #scope;
  #graph;
  #parent;
  #cache;
  #cleanups;
  #get;

  constructor(scope, graph, parent = null) {
    this.#scope = scope;
    this.#graph = graph;
    this.#parent = parent;
    this.#cache = new Map();
    this.#cleanups = [];

    this.#get = this.get.bind(this);
  }

  async get(key) {
    const node = this.#graph.get(key);
    if (!node) {
      throw new KeyNotRegisteredError(key);
    }

    if (this.#scope !== node.scope) {
      if (this.#parent) {
        return this.#parent.get(key);
      } else {
        throw new OutOfScopeResolutionError(key, node.scope);
      }
    }

    if (this.#cache.has(key)) {
      return this.#cache.get(key);
    }

    const maybePromise = node.resolve(this.#get, this.#cleanups);

    this.#cache.set(key, maybePromise);
    const result = await maybePromise;
    this.#cache.set(key, result);

    return result;
  }

  async close(errors = []) {
    for (let i = this.#cleanups.length - 1; i >= 0; i--) {
      try {
        const r = await this.#cleanups[i].next();
        if (!r.done) {
          errors.push(new InvalidCleanupGeneratorError());
        }
      } catch (e) {
        errors.push(e);
      }
    }

    this.#cache.clear();

    if (errors.length === 0) {
      return;
    }

    if (this.#parent) {
      return this.#parent.close(errors);
    }

    throw new ContainerCleanupError(errors);
  }

  async withNestedScope(scope, action) {
    const nextScope = this.#scope - 1;

    if (isFunction(scope)) {
      action = scope;
      scope = nextScope;
    }

    if (scope === this.#scope) {
      return action(this);
    }

    if (scope > this.#scope) {
      throw new InvalidScopeTransitionError(this.#scope, scope);
    }

    const nestedContainer = new AsyncContainer(nextScope, this.#graph, this);

    try {
      return scope < nextScope
        ? await nestedContainer.withNestedScope(scope, action)
        : await action(nestedContainer);
    } finally {
      await nestedContainer.close();
    }
  }

  get scope() {
    return this.#scope;
  }
}

export { AsyncContainer };
