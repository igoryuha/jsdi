import { test, expect } from "@jest/globals";
import { makeAsyncContainer, Provider, Scope, Mode } from "jsdi";
import { D, C, B, A } from "./fixtures.js";

test.each([Mode.SAFE, Mode.FAST])("can resolve with app scope", async (mode) => {
  const provider = new Provider(Scope.APP);
  provider.provide(D);
  provider.provide(C, [D]);
  provider.provide(B);
  provider.provide(A, [B, C]);

  const appContainer = makeAsyncContainer(Scope.APP, [provider], mode);

  const resolved = await appContainer.get(A);

  expect(resolved).toBeInstanceOf(A);
  expect(resolved.b).toBeInstanceOf(B);
  expect(resolved.c).toBeInstanceOf(C);
  expect(resolved.c.d).toBeInstanceOf(D);

  expect(appContainer.scope).toBe(Scope.APP);
});

test.each([Mode.SAFE, Mode.FAST])("can resolve with request scope", async (mode) => {
  const provider1 = new Provider(Scope.APP);
  provider1.provide(D);
  provider1.provide(C, [D]);
  provider1.provide(B);

  const provider2 = new Provider(Scope.REQUEST);
  provider2.provide(A, [B, C]);

  const appContainer = makeAsyncContainer(Scope.APP, [provider1, provider2], mode);

  await appContainer.withNestedScope(Scope.REQUEST, async (requestContainer) => {
    const resolved = await requestContainer.get(A);

    expect(resolved).toBeInstanceOf(A);
    expect(resolved.b).toBeInstanceOf(B);
    expect(resolved.c).toBeInstanceOf(C);
    expect(resolved.c.d).toBeInstanceOf(D);

    expect(requestContainer.scope).toBe(Scope.REQUEST);
  });

  expect(appContainer.scope).toBe(Scope.APP);
});

test.each([Mode.SAFE, Mode.FAST])("can resolve by skipping scopes", async (mode) => {
  const provider1 = new Provider(Scope.REQUEST);
  provider1.provide(D);
  provider1.provide(C, [D]);
  provider1.provide(B);

  const provider2 = new Provider(Scope.ACTION);
  provider2.provide(A, [B, C]);

  const appContainer = makeAsyncContainer(Scope.APP, [provider1, provider2], mode);

  await appContainer.withNestedScope(Scope.ACTION, async (actionContainer) => {
    const resolved = await actionContainer.get(A);

    expect(resolved).toBeInstanceOf(A);
    expect(resolved.b).toBeInstanceOf(B);
    expect(resolved.c).toBeInstanceOf(C);
    expect(resolved.c.d).toBeInstanceOf(D);

    expect(actionContainer.scope).toBe(Scope.ACTION);
  });

  expect(appContainer.scope).toBe(Scope.APP);
});

test.each([Mode.SAFE, Mode.FAST])(
  "throws when resolving scoped class outside its scope",
  async (mode) => {
    const provider1 = new Provider(Scope.APP);
    provider1.provide(D);

    const provider2 = new Provider(Scope.REQUEST);
    provider2.provide(C, [D]);

    const appContainer = makeAsyncContainer(Scope.APP, [provider1, provider2], mode);

    await expect(async () => await appContainer.get(C)).rejects.toThrow(
      "cannot resolve a dependency outside of its scope",
    );
  },
);

test.each([Mode.SAFE, Mode.FAST])("caches in app scope", async (mode) => {
  const provider = new Provider(Scope.APP);
  provider.provide(D);

  const appContainer = makeAsyncContainer(Scope.APP, [provider], mode);

  const firstResolved = await appContainer.get(D);
  const secondResolved = await appContainer.get(D);

  expect(firstResolved).toBe(secondResolved);
});

test.each([Mode.SAFE, Mode.FAST])("caches in request scope", async (mode) => {
  const provider1 = new Provider(Scope.APP);
  provider1.provide(D);

  const provider2 = new Provider(Scope.REQUEST);
  provider2.provide(C, [D]);

  const appContainer = makeAsyncContainer(Scope.APP, [provider1, provider2], mode);

  await appContainer.withNestedScope(Scope.REQUEST, async (requestContainer) => {
    const firstResolved = await requestContainer.get(C);
    const secondResolved = await requestContainer.get(C);

    expect(firstResolved).toBe(secondResolved);
  });
});

test.each([Mode.SAFE, Mode.FAST])("sync factory dependence", async (mode) => {
  const provider = new Provider(Scope.APP);
  provider.provide(D, function () {
    return new D();
  });
  provider.provide(C, [D], function (d) {
    return new C(d);
  });
  provider.provide(B, function () {
    return new B();
  });
  provider.provide(A, [B, C], function (b, c) {
    return new A(b, c);
  });

  const appContainer = makeAsyncContainer(Scope.APP, [provider], mode);
  const resolved = await appContainer.get(A);

  expect(resolved).toBeInstanceOf(A);
  expect(resolved.b).toBeInstanceOf(B);
  expect(resolved.c).toBeInstanceOf(C);
  expect(resolved.c.d).toBeInstanceOf(D);
});

test.each([Mode.SAFE, Mode.FAST])("async factory dependence", async (mode) => {
  const provider = new Provider(Scope.APP);
  provider.provide(D, async function () {
    return new D();
  });
  provider.provide(C, [D], async function (d) {
    return new C(d);
  });
  provider.provide(B, async function () {
    return new B();
  });
  provider.provide(A, [B, C], function (b, c) {
    return new A(b, c);
  });

  const appContainer = makeAsyncContainer(Scope.APP, [provider], mode);
  const resolved = await appContainer.get(A);

  expect(resolved).toBeInstanceOf(A);
  expect(resolved.b).toBeInstanceOf(B);
  expect(resolved.c).toBeInstanceOf(C);
  expect(resolved.c.d).toBeInstanceOf(D);
});

test.each([Mode.SAFE, Mode.FAST])("sync generator factory dependence", async (mode) => {
  const provider = new Provider(Scope.APP);
  provider.provide(D, function* () {
    yield new D();
  });
  provider.provide(C, [D], function* (d) {
    yield new C(d);
  });
  provider.provide(B, function* () {
    yield new B();
  });
  provider.provide(A, [B, C], function* (b, c) {
    yield new A(b, c);
  });

  const appContainer = makeAsyncContainer(Scope.APP, [provider], mode);
  const resolved = await appContainer.get(A);

  expect(resolved).toBeInstanceOf(A);
  expect(resolved.b).toBeInstanceOf(B);
  expect(resolved.c).toBeInstanceOf(C);
  expect(resolved.c.d).toBeInstanceOf(D);
});

test.each([Mode.SAFE, Mode.FAST])("async generator factory dependence", async (mode) => {
  const provider = new Provider(Scope.APP);
  provider.provide(D, async function* () {
    yield new D();
  });
  provider.provide(C, [D], async function* (d) {
    yield new C(d);
  });
  provider.provide(B, async function* () {
    yield new B();
  });
  provider.provide(A, [B, C], async function* (b, c) {
    yield new A(b, c);
  });

  const appContainer = makeAsyncContainer(Scope.APP, [provider], mode);
  const resolved = await appContainer.get(A);

  expect(resolved).toBeInstanceOf(A);
  expect(resolved.b).toBeInstanceOf(B);
  expect(resolved.c).toBeInstanceOf(C);
  expect(resolved.c.d).toBeInstanceOf(D);
});

test.each([Mode.SAFE, Mode.FAST])("finalizing with sync generator factory", async (mode) => {
  let cFinalized = false;
  let dFinalized = false;

  const provider1 = new Provider(Scope.REQUEST);
  provider1.provide(D, function* () {
    yield new D();
    dFinalized = true;
  });

  const provider2 = new Provider(Scope.ACTION);
  provider2.provide(C, [D], function* (d) {
    yield new C(d);
    cFinalized = true;
  });

  const appContainer = makeAsyncContainer(Scope.APP, [provider1, provider2], mode);

  await appContainer.withNestedScope(Scope.REQUEST, async (requestContainer) => {
    await requestContainer.get(D);
    expect(dFinalized).toBeFalsy();

    await requestContainer.withNestedScope(Scope.ACTION, async (actionContainer) => {
      await actionContainer.get(C);
      expect(cFinalized).toBeFalsy();
    });

    expect(cFinalized).toBeTruthy();
  });

  expect(dFinalized).toBeTruthy();
});

test.each([Mode.SAFE, Mode.FAST])("finalizing with async generator factory", async (mode) => {
  let cFinalized = false;
  let dFinalized = false;

  const provider1 = new Provider(Scope.REQUEST);
  provider1.provide(D, async function* () {
    yield new D();
    dFinalized = true;
  });

  const provider2 = new Provider(Scope.ACTION);
  provider2.provide(C, [D], async function* (d) {
    yield new C(d);
    cFinalized = true;
  });

  const appContainer = makeAsyncContainer(Scope.APP, [provider1, provider2], mode);

  await appContainer.withNestedScope(Scope.REQUEST, async (requestContainer) => {
    await requestContainer.get(D);
    expect(dFinalized).toBeFalsy();

    await requestContainer.withNestedScope(Scope.ACTION, async (actionContainer) => {
      await actionContainer.get(C);
      expect(cFinalized).toBeFalsy();
    });

    expect(cFinalized).toBeTruthy();
  });

  expect(dFinalized).toBeTruthy();
});

test.each([Mode.SAFE, Mode.FAST])(
  "entering the next scope without explicitly specifying it",
  async (mode) => {
    const appContainer = makeAsyncContainer(Scope.APP, [], mode);

    await appContainer.withNestedScope(async (requestContainer) => {
      expect(requestContainer.scope).toBe(Scope.REQUEST);

      await requestContainer.withNestedScope((actionContainer) => {
        expect(actionContainer.scope).toBe(Scope.ACTION);
      });
    });
  },
);
