class Container {
    #scope
    #graph
    #parent
    #cache
    #cleanups
    #get

    constructor(scope, graph, parent = null) {
        this.#scope = scope;
        this.#graph = graph;
        this.#parent = parent
        this.#cache = new Map();
        this.#cleanups = [];

        this.#get = this.get.bind(this);
    }

    #cacheResult(key, value) {
        this.#cache.set(key, value);
        return value;
    }

    get(key) {
        const node = this.#graph.get(key);
        if (!node) {
            throw new Error('key is not registered in the container');
        }

        if (this.#scope !== node.scope) {
            if (this.#parent) {
                return this.#parent.get(key);
            } else {
                throw new Error("cannot resolve a dependency outside of its scope");
            }
        }
        
        if (this.#cache.has(key)) {
            return this.#cache.get(key);
        }

        return this.#cacheResult(
            key,
            node.resolve(this.#get, this.#cleanups),
        )
    }

    close() {
        for (let i = 0; i < this.#cleanups.length; i++) {
            try {
                const r = this.#cleanups[i].next();
                if (!r.done) {
                    throw new Error("cleanup generator must yield exactly once");
                }
            } catch(e) {
                console.error("cleanup failed:", e);
            }
        }
        this.#cache.clear();
    }

    withNestedScope(scope, action) {
        const nextScope = this.#scope-1;

        if (scope === this.#scope) {
            return action(this);
        }

        if (scope > this.#scope) {
            throw new Error(`cannot enter wider scope: from ${this.#scope} to ${scope}`);
        }

        const nestedContainer = new Container(nextScope, this.#graph, this);
        try {
            if (scope < nextScope) {
                return nestedContainer.withNestedScope(scope, action);
            }
            return action(nestedContainer);
        } finally {
            nestedContainer.close();
        }
    }
}

export { Container }
