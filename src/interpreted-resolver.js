import { isGenerator } from "./type-guards.js";

function createTypeResolver(type, depends) {
    switch (depends.length) {
        case 0: {
            return (get, cleanups) => new type();
        }
        case 1: {
            const [d1] = depends;
            return (get, cleanups) => new type(get(d1));
        }
        case 2: {
            const [d1, d2] = depends;
            return (get, cleanups) => new type(get(d1), get(d2));
        }
        case 3: {
            const [d1, d2, d3] = depends;
            return (get, cleanups) => new type(get(d1), get(d2), get(d3));
        }
        case 4: {
            const [d1, d2, d3, d4] = depends;
            return (get, cleanups) => new type(get(d1), get(d2), get(d3), get(d4));
        }
        default: {
            return (get, cleanups) => {
                const resolvedArgs = new Array(depends.length);
                for (let i = 0; i < depends.length; i++) {
                    resolvedArgs[i] = get(depends[i]);
                }
                return new type(...resolvedArgs);
            }
        }
    }
}

function createFnResolver(factory, depends) {
    switch (depends.length) {
        case 0: {
            return (get, cleanups) => factory();
        }
        case 1: {
            const [d1] = depends;
            return (get, cleanups) => factory(get(d1));
        }
        case 2: {
            const [d1, d2] = depends;
            return (get, cleanups) => factory(get(d1), get(d2));
        }
        case 3: {
            const [d1, d2, d3] = depends;
            return (get, cleanups) => factory(get(d1), get(d2), get(d3));
        }
        case 4: {
            const [d1, d2, d3, d4] = depends;
            return (get, cleanups) => factory(get(d1), get(d2), get(d3), get(d4));
        }
        default: {
            return (get, cleanups) => {
                const resolvedArgs = new Array(depends.length);
                for (let i = 0; i < depends.length; i++) {
                    resolvedArgs[i] = get(depends[i]);
                }
                return factory(...resolvedArgs);
            }
        }
    }
}

function createGenResolver(factory, depends) {
    const call = createFnResolver(factory, depends);
    return (get, cleanups) => {
        const gen = call(get, cleanups);
        const { value, done } = gen.next();

        if (done) {
            throw new Error("generator factory must yield a value");
        }
        
        cleanups.push(gen);
        return value;
    }
}

function makeInterpretedResolver(factory, depends, type) {
    return factory
        ? isGenerator(factory)
            ? createGenResolver(factory, depends)
            : createFnResolver(factory, depends)
        : createTypeResolver(type, depends)
}

export {
    makeInterpretedResolver,
}
