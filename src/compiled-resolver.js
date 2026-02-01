import { isGenerator } from "./type-guards.js";

function makeArgList(depCount) {
    const args = [];
    for (let i = 0; i < depCount; i++) {
        args.push(`get(depends[${i}])`)
    }
    return args.join(",");
}

function compileTypeResolver(type, depends) {
    const args = makeArgList(depends.length);
    const tmpl = `
return (get, cleanups) => {
    return new type(${args});
}
    `
    const fn = new Function('type', 'depends', tmpl);
    return fn(type, depends);
}

function compileFnResolver(factory, depends) {
    const args = makeArgList(depends.length);
    const tmpl = `
return (get, cleanups) => {
    return factory(${args});
}
    `
    const fn = new Function('factory', 'depends', tmpl);
    return fn(factory, depends);
}

function compileGenResolver(factory, depends) {
    const args = makeArgList(depends.length);
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
    `
    const fn = new Function('factory', 'depends', tmpl);
    return fn(factory, depends);
}

function makeCompiledResolver(factory, depends, type) {
    return factory
        ? isGenerator(factory)
            ? compileGenResolver(factory, depends)
            : compileFnResolver(factory, depends)
        : compileTypeResolver(type, depends)
}

export {
    makeCompiledResolver,
}
