import { exists, integer, object, string } from 'kitimat-jest';

exists.only('this is the only thing that will run', [integer({ minSize: 2, maxSize: 15 })], a => {
  expect(a).toBeGreaterThan(1);
});

// THIS TEST IS INTENTIONALLY SKIPPED
exists(
  'this is a normal test',
  [object<{ b: number }>({ b: integer({ minSize: 2, maxSize: 40 }) })],
  async (a, done) => {
    expect(a.b).toBeGreaterThan(1);
    done();
  },
);

// THIS TEST IS INTENTIONALLY SKIPPED
exists.skip('this will get skipped', [integer({ minSize: 2, maxSize: 15 })], a => {
  expect(a).toBeGreaterThan(1);
});
