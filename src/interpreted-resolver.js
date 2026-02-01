import { isGeneratorFunction, isAsyncFunction, isAsyncGeneratorFunction } from "./type-guards.js";

function createSyncTypeResolver(type, deps) {
  switch (deps.length) {
    case 0: {
      return (_get, _cleanups) => new type();
    }
    case 1: {
      const [d1] = deps;
      return (get, _cleanups) => new type(get(d1));
    }
    case 2: {
      const [d1, d2] = deps;
      return (get, _cleanups) => new type(get(d1), get(d2));
    }
    case 3: {
      const [d1, d2, d3] = deps;
      return (get, _cleanups) => new type(get(d1), get(d2), get(d3));
    }
    case 4: {
      const [d1, d2, d3, d4] = deps;
      return (get, _cleanups) => new type(get(d1), get(d2), get(d3), get(d4));
    }
    case 5: {
      const [d1, d2, d3, d4, d5] = deps;
      return (get, _cleanups) => new type(get(d1), get(d2), get(d3), get(d4), get(d5));
    }
    case 6: {
      const [d1, d2, d3, d4, d5, d6] = deps;
      return (get, _cleanups) => new type(get(d1), get(d2), get(d3), get(d4), get(d5), get(d6));
    }
    case 7: {
      const [d1, d2, d3, d4, d5, d6, d7] = deps;
      return (get, _cleanups) =>
        new type(get(d1), get(d2), get(d3), get(d4), get(d5), get(d6), get(d7));
    }
    default: {
      return (get, _cleanups) => {
        const resolvedArgs = new Array(deps.length);
        for (let i = 0; i < deps.length; i++) {
          resolvedArgs[i] = get(deps[i]);
        }
        return new type(...resolvedArgs);
      };
    }
  }
}

function createAsyncTypeResolver(type, deps) {
  switch (deps.length) {
    case 0: {
      return async (_get, _cleanups) => new type();
    }
    case 1: {
      const [d1] = deps;
      return async (get, _cleanups) => new type(await get(d1));
    }
    case 2: {
      const [d1, d2] = deps;
      return async (get, _cleanups) => new type(await get(d1), await get(d2));
    }
    case 3: {
      const [d1, d2, d3] = deps;
      return async (get, _cleanups) => new type(await get(d1), await get(d2), await get(d3));
    }
    case 4: {
      const [d1, d2, d3, d4] = deps;
      return async (get, _cleanups) =>
        new type(await get(d1), await get(d2), await get(d3), await get(d4));
    }
    case 5: {
      const [d1, d2, d3, d4, d5] = deps;
      return async (get, _cleanups) =>
        new type(await get(d1), await get(d2), await get(d3), await get(d4), await get(d5));
    }
    case 6: {
      const [d1, d2, d3, d4, d5, d6] = deps;
      return async (get, _cleanups) =>
        new type(
          await get(d1),
          await get(d2),
          await get(d3),
          await get(d4),
          await get(d5),
          await get(d6),
        );
    }
    case 7: {
      const [d1, d2, d3, d4, d5, d6, d7] = deps;
      return async (get, _cleanups) =>
        new type(
          await get(d1),
          await get(d2),
          await get(d3),
          await get(d4),
          await get(d5),
          await get(d6),
          await get(d7),
        );
    }
    default: {
      return (get, _cleanups) => {
        const resolvedArgs = new Array(deps.length);
        for (let i = 0; i < deps.length; i++) {
          resolvedArgs[i] = get(deps[i]);
        }
        return new type(...resolvedArgs);
      };
    }
  }
}

function createSyncFnResolver(factory, deps) {
  switch (deps.length) {
    case 0: {
      return (_get, _cleanups) => factory();
    }
    case 1: {
      const [d1] = deps;
      return (get, _cleanups) => factory(get(d1));
    }
    case 2: {
      const [d1, d2] = deps;
      return (get, _cleanups) => factory(get(d1), get(d2));
    }
    case 3: {
      const [d1, d2, d3] = deps;
      return (get, _cleanups) => factory(get(d1), get(d2), get(d3));
    }
    case 4: {
      const [d1, d2, d3, d4] = deps;
      return (get, _cleanups) => factory(get(d1), get(d2), get(d3), get(d4));
    }
    case 5: {
      const [d1, d2, d3, d4, d5] = deps;
      return (get, _cleanups) => factory(get(d1), get(d2), get(d3), get(d4), get(d5));
    }
    case 6: {
      const [d1, d2, d3, d4, d5, d6] = deps;
      return (get, _cleanups) => factory(get(d1), get(d2), get(d3), get(d4), get(d5), get(d6));
    }
    case 7: {
      const [d1, d2, d3, d4, d5, d6, d7] = deps;
      return (get, _cleanups) =>
        factory(get(d1), get(d2), get(d3), get(d4), get(d5), get(d6), get(d7));
    }
    default: {
      return (get, _cleanups) => {
        const resolvedArgs = new Array(deps.length);
        for (let i = 0; i < deps.length; i++) {
          resolvedArgs[i] = get(deps[i]);
        }
        return factory(...resolvedArgs);
      };
    }
  }
}

function createAsyncFnResolver(factory, deps) {
  switch (deps.length) {
    case 0: {
      return async (_get, _cleanups) => factory();
    }
    case 1: {
      const [d1] = deps;
      return async (get, _cleanups) => factory(await get(d1));
    }
    case 2: {
      const [d1, d2] = deps;
      return async (get, _cleanups) => factory(await get(d1), await get(d2));
    }
    case 3: {
      const [d1, d2, d3] = deps;
      return async (get, _cleanups) => factory(await get(d1), await get(d2), await get(d3));
    }
    case 4: {
      const [d1, d2, d3, d4] = deps;
      return async (get, _cleanups) =>
        factory(await get(d1), await get(d2), await get(d3), await get(d4));
    }
    case 5: {
      const [d1, d2, d3, d4, d5] = deps;
      return async (get, _cleanups) =>
        factory(await get(d1), await get(d2), await get(d3), await get(d4), await get(d5));
    }
    case 6: {
      const [d1, d2, d3, d4, d5, d6] = deps;
      return async (get, _cleanups) =>
        factory(
          await get(d1),
          await get(d2),
          await get(d3),
          await get(d4),
          await get(d5),
          await get(d6),
        );
    }
    case 7: {
      const [d1, d2, d3, d4, d5, d6, d7] = deps;
      return async (get, _cleanups) =>
        factory(
          await get(d1),
          await get(d2),
          await get(d3),
          await get(d4),
          await get(d5),
          await get(d6),
          await get(d7),
        );
    }
    default: {
      return async (get, _cleanups) => {
        const resolvedArgs = new Array(deps.length);
        for (let i = 0; i < deps.length; i++) {
          resolvedArgs[i] = await get(deps[i]);
        }
        return factory(...resolvedArgs);
      };
    }
  }
}

function createSyncGenResolver(factory, deps) {
  const call = createSyncFnResolver(factory, deps);
  return (get, cleanups) => {
    const gen = call(get, cleanups);
    const { value, done } = gen.next();

    if (done) {
      throw new Error("generator factory must yield a value");
    }

    cleanups.push(gen);
    return value;
  };
}

function createAsyncGenResolver(factory, deps) {
  const call = createAsyncFnResolver(factory, deps);
  return async (get, cleanups) => {
    const gen = await call(get, cleanups);
    const { value, done } = await gen.next();

    if (done) {
      throw new Error("generator factory must yield a value");
    }

    cleanups.push(gen);
    return value;
  };
}

function createSyncInterpretedResolver(factory, deps, type) {
  if (factory) {
    if (isAsyncFunction(factory) || isAsyncGeneratorFunction(factory)) {
      throw new Error("async factory is not allowed in sync container; use async container");
    }

    return isGeneratorFunction(factory)
      ? createSyncGenResolver(factory, deps)
      : createSyncFnResolver(factory, deps);
  }
  return createSyncTypeResolver(type, deps);
}

function createAsyncInterpretedResolver(factory, deps, type) {
  if (factory) {
    if (isAsyncGeneratorFunction(factory) || isGeneratorFunction(factory)) {
      return createAsyncGenResolver(factory, deps);
    }
    return createAsyncFnResolver(factory, deps);
  }

  return createAsyncTypeResolver(type, deps);
}

export { createSyncInterpretedResolver, createAsyncInterpretedResolver };
