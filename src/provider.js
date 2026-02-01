import { Container } from "./container.js";
import { makeCompiledResolver } from "./compiled-resolver.js";
import { makeInterpretedResolver } from "./interpreted-resolver.js";
import { isArray, isFunction, isUndefined } from "./type-guards.js";

const Scope = Object.freeze({
    APP: 3,
    REQUEST: 2,
    ACTION: 1,
})

function resolverFactory(mode) {
    if (mode === "safe") {
        return makeInterpretedResolver;
    } else if (mode === "fast") {
        return makeCompiledResolver;
    } else {
        throw new Error(`unknown mode: ${mode}`);
    }
}

function normalizeProvideArgs(dependsOrFactory, maybeFactory) {
    let depends = [];
    let factory;

    if (isArray(dependsOrFactory)) {
        if (!isUndefined(maybeFactory) && !isFunction(maybeFactory)) {
            throw new TypeError("factory must be a function");
        }
        depends = dependsOrFactory;
        factory = maybeFactory;
    } else if (isFunction(dependsOrFactory)) {
        if (!isUndefined(maybeFactory)) {
            throw new TypeError("if second argument is a factory, third argument must be omitted");
        }
        factory = dependsOrFactory;
    } else if (!isUndefined(dependsOrFactory)) {
        throw new TypeError("second argument must be an array of deps or a factory function");
    }

    return { depends, factory };
}

class Provider {
    #scope
    #graph
    #resolverFactory

    constructor(scope, mode = "safe") {
        this.#scope = scope;
        this.#graph = new Map();

        this.#resolverFactory = resolverFactory(mode);
    }

    provide(type, dependsOrFactory, maybeFactory) {
        const { depends, factory } = normalizeProvideArgs(dependsOrFactory, maybeFactory);

        const resolve = this.#resolverFactory(factory, depends, type)

        this.#graph.set(
            type, 
            {
                scope: this.#scope,
                resolve,
                depends,
            }
        )
    }

    mergeInto(graph) {
        for (const [key, val] of this.#graph) {
            graph.set(key, val);
        }
    }
}

function hasCycle(graph) {
    const visited = new Set();
    const path = new Set();

    function step(key) {
        if (path.has(key)) {
            return true;
        }

        if (visited.has(key)) {
            return false;
        }

        const node = graph.get(key);
        if (!node) {
            throw new Error('missing provider');
        }

        path.add(key);
        
        for (const depend of node.depends) {
            if (step(depend)) {
                return true;
            }
        }
        
        visited.add(key);
        path.delete(key);

        return false;
    }

    for (const key of graph.keys()) {
        if (step(key)) {
            return true;
        }
    }

    return false;
}

function makeContainer(name, providers) {
    const graph = new Map();
    for (const provider of providers) {
        provider.mergeInto(graph)
    }

    if (hasCycle(graph)) {
        throw Error("cyclic dependency detected");
    }

    return new Container(name, graph);
}

export {
    Scope,
    Provider,
    makeContainer,
}
