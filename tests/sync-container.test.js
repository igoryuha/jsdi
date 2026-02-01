import { test, expect } from "@jest/globals";
import { makeSyncContainer, Provider, Scope, Mode } from "jsdi";
import { D, C, B, A } from "./fixtures.js";

test.each([Mode.SAFE, Mode.FAST])("can resolve with app scope", (mode) => {
  const provider = new Provider(Scope.APP);
  provider.provide(D);
  provider.provide(C, [D]);
  provider.provide(B);
  provider.provide(A, [B, C]);

  const appContainer = makeSyncContainer(Scope.APP, [provider], mode);

  const resolved = appContainer.get(A);

  expect(resolved).toBeInstanceOf(A);
  expect(resolved.b).toBeInstanceOf(B);
  expect(resolved.c).toBeInstanceOf(C);
  expect(resolved.c.d).toBeInstanceOf(D);

  expect(appContainer.scope).toBe(Scope.APP);
});

test.each([Mode.SAFE, Mode.FAST])("can resolve with request scope", (mode) => {
  const provider1 = new Provider(Scope.APP);
  provider1.provide(D);
  provider1.provide(C, [D]);
  provider1.provide(B);

  const provider2 = new Provider(Scope.REQUEST);
  provider2.provide(A, [B, C]);

  const appContainer = makeSyncContainer(Scope.APP, [provider1, provider2], mode);

  appContainer.withNestedScope(Scope.REQUEST, (requestContainer) => {
    const resolved = requestContainer.get(A);

    expect(resolved).toBeInstanceOf(A);
    expect(resolved.b).toBeInstanceOf(B);
    expect(resolved.c).toBeInstanceOf(C);
    expect(resolved.c.d).toBeInstanceOf(D);

    expect(requestContainer.scope).toBe(Scope.REQUEST);
  });

  expect(appContainer.scope).toBe(Scope.APP);
});

test.each([Mode.SAFE, Mode.FAST])("can resolve by skipping scopes", (mode) => {
  const provider1 = new Provider(Scope.REQUEST);
  provider1.provide(D);
  provider1.provide(C, [D]);
  provider1.provide(B);

  const provider2 = new Provider(Scope.ACTION);
  provider2.provide(A, [B, C]);

  const appContainer = makeSyncContainer(Scope.APP, [provider1, provider2], mode);

  appContainer.withNestedScope(Scope.ACTION, (actionContainer) => {
    const resolved = actionContainer.get(A);

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
  (mode) => {
    const provider1 = new Provider(Scope.APP);
    provider1.provide(D);

    const provider2 = new Provider(Scope.REQUEST);
    provider2.provide(C, [D]);

    const appContainer = makeSyncContainer(Scope.APP, [provider1, provider2], mode);

    expect(() => appContainer.get(C)).toThrow("cannot resolve a dependency outside of its scope");
  },
);

test.each([Mode.SAFE, Mode.FAST])("caches in app scope", (mode) => {
  const provider = new Provider(Scope.APP);
  provider.provide(D);

  const appContainer = makeSyncContainer(Scope.APP, [provider], mode);

  const firstResolved = appContainer.get(D);
  const secondResolved = appContainer.get(D);

  expect(firstResolved).toBe(secondResolved);
});

test.each([Mode.SAFE, Mode.FAST])("caches in request scope", (mode) => {
  const provider1 = new Provider(Scope.APP);
  provider1.provide(D);

  const provider2 = new Provider(Scope.REQUEST);
  provider2.provide(C, [D]);

  const appContainer = makeSyncContainer(Scope.APP, [provider1, provider2], mode);

  appContainer.withNestedScope(Scope.REQUEST, (requestContainer) => {
    const firstResolved = requestContainer.get(C);
    const secondResolved = requestContainer.get(C);

    expect(firstResolved).toBe(secondResolved);
  });
});

test.each([Mode.SAFE, Mode.FAST])("factory dependence", (mode) => {
  const provider1 = new Provider(Scope.APP);
  provider1.provide(D);

  const provider2 = new Provider(Scope.REQUEST);
  provider2.provide(C, [D], function (d) {
    return new C(d);
  });

  const appContainer = makeSyncContainer(Scope.APP, [provider1, provider2], mode);

  appContainer.withNestedScope(Scope.REQUEST, (requestContainer) => {
    const resolved = requestContainer.get(C);

    expect(resolved).toBeInstanceOf(C);
    expect(resolved.d).toBeInstanceOf(D);
  });
});

test.each([Mode.SAFE, Mode.FAST])("finalizing", (mode) => {
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

  const appContainer = makeSyncContainer(Scope.APP, [provider1, provider2], mode);

  appContainer.withNestedScope(Scope.REQUEST, (requestContainer) => {
    requestContainer.get(D);
    expect(dFinalized).toBeFalsy();

    requestContainer.withNestedScope(Scope.ACTION, (actionContainer) => {
      actionContainer.get(C);
      expect(cFinalized).toBeFalsy();
    });

    expect(cFinalized).toBeTruthy();
  });

  expect(dFinalized).toBeTruthy();
});

test.each([Mode.SAFE, Mode.FAST])(
  "entering the next scope without explicitly specifying it",
  (mode) => {
    const appContainer = makeSyncContainer(Scope.APP, [], mode);

    appContainer.withNestedScope((requestContainer) => {
      expect(requestContainer.scope).toBe(Scope.REQUEST);

      requestContainer.withNestedScope((actionContainer) => {
        expect(actionContainer.scope).toBe(Scope.ACTION);
      });
    });
  },
);

test.each([Mode.SAFE, Mode.FAST])(
  "finalization will not occur until the promise is fulfilled",
  async (mode) => {
    let finalized = false;

    const provider1 = new Provider(Scope.APP);
    provider1.provide(D);

    const provider2 = new Provider(Scope.REQUEST);
    provider2.provide(C, [D], function* (d) {
      yield new C(d);
      finalized = true;
    });

    const appContainer = makeSyncContainer(Scope.APP, [provider1, provider2], mode);

    let resolve;
    const pending = () => new Promise((r) => (resolve = r));

    const result = appContainer.withNestedScope(Scope.REQUEST, (requestContainer) => {
      requestContainer.get(C);

      return pending();
    });

    expect(finalized).toBeFalsy();
    resolve();
    await result;
    expect(finalized).toBeTruthy();
  },
);
