import { Scope, Provider, makeAsyncContainer, makeSyncContainer } from "../src/index.js";

class CCCC {
  constructor() {}
}

class CCC {
  constructor(cccc) {}
}

class CC {
  constructor(ccc) {}
}

class C {
  constructor(cc) {}
}

class BBBB {
  constructor() {}
}

class BBB {
  constructor(bbbb) {}
}

class BB {
  constructor(bbb) {}
}

class B {
  constructor(bb) {}
}

class DDDD {
  constructor() {}
}

class DDD {
  constructor(dddd) {}
}

class DD {
  constructor(ddd) {}
}

class D {
  constructor(dd) {}
}

class A {
  constructor(b, c, d) {
    this.b = b;
    this.c = c;
    this.d = d;
  }
}

const provider = new Provider(Scope.REQUEST);
provider.provide(A, [B, C, D]);
provider.provide(B, [BB]);
provider.provide(BB, [BBB]);
provider.provide(BBB, [BBBB]);
provider.provide(BBBB);
provider.provide(C, [CC]);
provider.provide(CC, [CCC]);
provider.provide(CCC, [CCCC]);
provider.provide(CCCC);
provider.provide(D, [DD]);
provider.provide(DD, [DDD]);
provider.provide(DDD, [DDDD]);
provider.provide(DDDD);

async function runAsync() {
  const appContainer = makeAsyncContainer(Scope.APP, [provider]);

  const start = performance.now();
  for (let i = 0; i < 1_000_000; i++) {
    await appContainer.withNestedScope(Scope.REQUEST, async (requestContainer) => {
      await requestContainer.get(A);
    });
  }
  console.log(performance.now() - start);
}

function runSync() {
  const appContainer = makeSyncContainer(Scope.APP, [provider]);

  const start = performance.now();
  for (let i = 0; i < 1_000_000; i++) {
    appContainer.withNestedScope(Scope.REQUEST, (requestContainer) => {
      requestContainer.get(A);
    });
  }
  console.log(performance.now() - start);
}

//runAsync();
runSync();
