import { isGeneratorFunction, isAsyncFunction, isAsyncGeneratorFunction } from "./type-guards.js";

function makeSyncArgList(depCount) {
  const args = [];
  for (let i = 0; i < depCount; i++) {
    args.push(`get(deps[${i}])`);
  }
  return args.join(",");
}

function makeAsyncArgList(depCount) {
  const args = [];
  for (let i = 0; i < depCount; i++) {
    args.push(`await get(deps[${i}])`);
  }
  return args.join(",");
}

function compileSyncTypeResolver(type, deps) {
  const args = makeSyncArgList(deps.length);
  const tmpl = `
return (get, cleanups) => {
    return new type(${args});
}
    `;
  const fn = new Function("type", "deps", tmpl);
  return fn(type, deps);
}

function compileAsyncTypeResolver(type, deps) {
  const args = makeAsyncArgList(deps.length);
  const tmpl = `
return async (get, cleanups) => {
    return new type(${args});
}
    `;
  const fn = new Function("type", "deps", tmpl);
  return fn(type, deps);
}

function compileSyncFnResolver(factory, deps) {
  const args = makeSyncArgList(deps.length);
  const tmpl = `
return (get, cleanups) => {
    return factory(${args});
}
    `;
  const fn = new Function("factory", "deps", tmpl);
  return fn(factory, deps);
}

function compileAsyncFnResolver(factory, deps) {
  const args = makeAsyncArgList(deps.length);
  const tmpl = `
return async (get, cleanups) => {
    return factory(${args});
}
    `;
  const fn = new Function("factory", "deps", tmpl);
  return fn(factory, deps);
}

function compileSyncGenResolver(factory, deps) {
  const args = makeSyncArgList(deps.length);
  const tmpl = `
return (get, cleanups) => {
    const gen = factory(${args});
    const { value, done } = gen.next();

    if (done) {
        throw new Error("generator factory must yield a value");
    }
    
    cleanups.push(gen);
    return value;
}
    `;
  const fn = new Function("factory", "deps", tmpl);
  return fn(factory, deps);
}

function compileAsyncGenResolver(factory, deps) {
  const args = makeAsyncArgList(deps.length);
  const tmpl = `
return async (get, cleanups) => {
    const gen = factory(${args});
    const { value, done } = await gen.next();

    if (done) {
        throw new Error("generator factory must yield a value");
    }
    
    cleanups.push(gen);
    return value;
}
    `;
  const fn = new Function("factory", "deps", tmpl);
  return fn(factory, deps);
}

function createSyncCompiledResolver(factory, deps, type) {
  if (factory) {
    if (isAsyncFunction(factory) || isAsyncGeneratorFunction(factory)) {
      throw new Error("async factory is not allowed in sync container; use async container");
    }

    return isGeneratorFunction(factory)
      ? compileSyncGenResolver(factory, deps)
      : compileSyncFnResolver(factory, deps);
  }
  return compileSyncTypeResolver(type, deps);
}

function createAsyncCompiledResolver(factory, deps, type) {
  if (factory) {
    if (isAsyncGeneratorFunction(factory) || isGeneratorFunction(factory)) {
      return compileAsyncGenResolver(factory, deps);
    }
    return compileAsyncFnResolver(factory, deps);
  }

  return compileAsyncTypeResolver(type, deps);
}

export { createSyncCompiledResolver, createAsyncCompiledResolver };
