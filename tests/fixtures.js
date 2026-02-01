class D1 {}

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

export { D1, D, C, B, A };
