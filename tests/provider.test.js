import { test, expect } from "@jest/globals";
import {
  makeSyncContainer,
  Provider,
  Scope,
  Mode,
  CyclicDependencyError,
  ProviderOverrideError,
} from "jsdi";
import { D1, D, C, B, A } from "./fixtures.js";

test.each([Mode.SAFE, Mode.FAST])("throws when cycle", (mode) => {
  const provider = new Provider(Scope.APP);
  provider.provide(D, [A]);
  provider.provide(C, [D]);
  provider.provide(B);
  provider.provide(A, [B, C]);

  expect(() => makeSyncContainer(Scope.APP, [provider], mode)).toThrow(CyclicDependencyError);
});

test.each([Mode.SAFE, Mode.FAST])("throws when missing provider", (mode) => {
  const provider = new Provider(Scope.APP);
  provider.provide(C, [D]);
  provider.provide(B);
  provider.provide(A, [B, C]);

  expect(() => makeSyncContainer(Scope.APP, [provider], mode)).toThrow("missing provider for D");
});

test.each([Mode.SAFE, Mode.FAST])("throws when scope violation", (mode) => {
  const provider1 = new Provider(Scope.APP);
  provider1.provide(C, [D]);
  provider1.provide(B);

  const provider2 = new Provider(Scope.REQUEST);
  provider2.provide(A, [B, C]);
  provider2.provide(D);

  expect(() => makeSyncContainer(Scope.APP, [provider1, provider2], mode)).toThrow(
    "dependency on nested scope for D",
  );
});

test.each([Mode.SAFE, Mode.FAST])(
  "the key cannot be overwritten if it already exists without explicitly specifying it",
  (mode) => {
    const provider1 = new Provider(Scope.APP);
    provider1.provide(D);

    const provider2 = new Provider(Scope.APP);
    provider2.provide(D);

    expect(() => makeSyncContainer(Scope.APP, [provider1, provider2], mode)).toThrow(
      ProviderOverrideError,
    );
  },
);

test.each([Mode.SAFE, Mode.FAST])(
  "the key can be overwritten if it already exists with an explicit indication",
  (mode) => {
    const provider1 = new Provider(Scope.APP);
    provider1.provide(D);

    const provider2 = new Provider(Scope.APP);
    provider2.provide(D, () => new D1(), { override: true });

    const appContainer = makeSyncContainer(Scope.APP, [provider1, provider2], mode);

    const resolved = appContainer.get(D);

    expect(resolved).toBeInstanceOf(D1);
  },
);

test.each([
  {
    name: "provide(key)",
    setup: () => {
      const provider = new Provider(Scope.APP);
      provider.provide(D);

      return { key: D, providers: [provider] };
    },
  },
  {
    name: "provide(key, depends[])",
    setup: () => {
      const provider = new Provider(Scope.APP);
      provider.provide(D);
      provider.provide(C, [D]);

      return { key: C, providers: [provider] };
    },
  },
  {
    name: "provide(key, factory)",
    setup: () => {
      const provider = new Provider(Scope.APP);
      provider.provide(D, () => new D());

      return { key: D, providers: [provider] };
    },
  },
  {
    name: "provide(key, options)",
    setup: () => {
      const provider1 = new Provider(Scope.APP);
      provider1.provide(D);

      const provider2 = new Provider(Scope.APP);
      provider2.provide(D, { override: true });

      return { key: D, providers: [provider1, provider2] };
    },
  },
  {
    name: "provide(key, depends[], factory)",
    setup: () => {
      const provider = new Provider(Scope.APP);
      provider.provide(D);
      provider.provide(C, [D], (d) => new C(d));

      return { key: C, providers: [provider] };
    },
  },
  {
    name: "provide(key, depends[], options)",
    setup: () => {
      const provider1 = new Provider(Scope.APP);
      provider1.provide(D);
      provider1.provide(C, [D]);

      const provider2 = new Provider(Scope.APP);
      provider2.provide(C, [D], { override: true });

      return { key: C, providers: [provider1, provider2] };
    },
  },
  {
    name: "provide(key, factory, options)",
    setup: () => {
      const provider1 = new Provider(Scope.APP);
      provider1.provide(D);

      const provider2 = new Provider(Scope.APP);
      provider2.provide(D, () => new D(), { override: true });

      return { key: D, providers: [provider1, provider2] };
    },
  },
  {
    name: "provide(key, depends[], factory, options)",
    setup: () => {
      const provider1 = new Provider(Scope.APP);
      provider1.provide(D);
      provider1.provide(C, [D]);

      const provider2 = new Provider(Scope.APP);
      provider2.provide(C, [D], (d) => new C(d), { override: true });

      return { key: C, providers: [provider1, provider2] };
    },
  },
])("$name", ({ setup }) => {
  const { key, providers } = setup();

  const appContainer = makeSyncContainer(Scope.APP, providers);

  const resolved = appContainer.get(key);

  expect(resolved).toBeInstanceOf(key);
});
