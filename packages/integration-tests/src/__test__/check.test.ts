import { check, integer, object, string } from 'kitimat-jest';

check.only('this is the only thing that will run', [integer({ minSize: 2, maxSize: 15 })], a => {
  expect(a).toBeGreaterThan(1);
});

// THIS TEST IS INTENTIONALLY SKIPPED
check(
  'this is a normal test',
  [object<{ b: number }>({ b: integer({ minSize: 2, maxSize: 40 }) })],
  async (a, done) => {
    expect(a.b).toBeGreaterThan(1);
    done();
  },
);

// THIS TEST IS INTENTIONALLY SKIPPED
check.skip('this will get skipped', [integer({ minSize: 2, maxSize: 15 })], a => {
  expect(a).toBeGreaterThan(1);
});
