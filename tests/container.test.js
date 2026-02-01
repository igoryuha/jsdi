import { test, expect } from "@jest/globals";
import { makeContainer, Provider, Scope } from "jsdi";

class D {}

class C {
    constructor(d) {
        this.d = d;
    }
}

class B {}

class A {
    constructor(b, c) {
        this.b = b;
        this.c = c;
    }
}

test("resolves class with no dependencies", () => {
    const provider = new Provider(Scope.APP);
    provider.provide(D);

    const container = makeContainer(Scope.APP, [provider]);

    const resolved = container.get(D);

    expect(resolved).toBeInstanceOf(D);
});

test("resolves class with dependencies", () => {
    const provider = new Provider(Scope.APP);
    provider.provide(D);
    provider.provide(C, [D]);
    provider.provide(B);
    provider.provide(A, [B, C]);

    const container = makeContainer(Scope.APP, [provider]);

    const resolved = container.get(A);

    expect(resolved).toBeInstanceOf(A);
    expect(resolved.b).toBeInstanceOf(B);
    expect(resolved.c).toBeInstanceOf(C);
    expect(resolved.c.d).toBeInstanceOf(D);
});

test("resolves class with child scope", () => {
    const appProvider = new Provider(Scope.APP);
    appProvider.provide(D);
    appProvider.provide(C, [D]);
    appProvider.provide(B);

    const requestProvider = new Provider(Scope.REQUEST);
    requestProvider.provide(A, [B, C]);

    const appContainer = makeContainer(Scope.APP, [
        appProvider,
        requestProvider,
    ]);

    appContainer.withNestedScope(Scope.REQUEST, (requestContainer) => {
        const resolved = requestContainer.get(A);

        expect(resolved).toBeInstanceOf(A);
        expect(resolved.b).toBeInstanceOf(B);
        expect(resolved.c).toBeInstanceOf(C);
        expect(resolved.c.d).toBeInstanceOf(D);
    })
});

test("throws when resolving scoped class outside its scope", () => {
    const appProvider = new Provider(Scope.APP);
    appProvider.provide(D);
    appProvider.provide(C, [D]);
    appProvider.provide(B);

    const requestProvider = new Provider(Scope.REQUEST);
    requestProvider.provide(A, [B, C]);

    const container = makeContainer(Scope.APP, [
        appProvider,
        requestProvider,
    ]);

    expect(() => container.get(A))
        .toThrow("cannot resolve a dependency outside of its scope");
});


test("returns the same instance on subsequent resolves", () => {
    const provider = new Provider(Scope.APP);
    provider.provide(D);
    provider.provide(C, [D]);
    provider.provide(B);
    provider.provide(A, [B, C]);

    const container = makeContainer(Scope.APP, [provider]);

    const firstResolved = container.get(A);
    const secondResolved = container.get(A);

    expect(firstResolved).toBe(secondResolved);
});


test("returns the same instance on subsequent resolves with child scope", () => {
    const appProvider = new Provider(Scope.APP);
    appProvider.provide(D);
    appProvider.provide(C, [D]);
    appProvider.provide(B);

    const requestProvider = new Provider(Scope.REQUEST);
    requestProvider.provide(A, [B, C]);

    const appContainer = makeContainer(Scope.APP, [
        appProvider,
        requestProvider,
    ]);

    appContainer.withNestedScope(Scope.REQUEST, (requestContainer) => {
        const firstResolved = requestContainer.get(A);
        const secondResolved = requestContainer.get(A);

        expect(firstResolved).toBe(secondResolved);
    })
});
