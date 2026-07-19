import assert from 'node:assert/strict';
import test from 'node:test';

import { findSecretHitsInText } from './clientBundleSecretScan.mjs';

const FAKE_SB_SECRET = `sb_secret_${'a'.repeat(20)}`;
const FAKE_ANON_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.signaturepart';
const FAKE_SERVICE_ROLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signaturepart';

test('flags a fake sb_secret_ key with 20+ trailing characters', () => {
  const hits = findSecretHitsInText(`const x = "${FAKE_SB_SECRET}";`);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].kind, 'sb_secret_');
});

test('ignores bare sb_secret_ prefix text from library source', () => {
  const hits = findSecretHitsInText(
    'if (key.startsWith("sb_secret_")) { throw new Error("invalid"); }',
  );
  assert.equal(hits.length, 0);
});

test('flags a JWT whose payload role is service_role', () => {
  const hits = findSecretHitsInText(`token = "${FAKE_SERVICE_ROLE_JWT}";`);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].kind, 'service_role_jwt');
});

test('ignores plain service_role substring and anon JWTs', () => {
  const hits = findSecretHitsInText(`role must not be service_role in docs; anon=${FAKE_ANON_JWT}`);
  assert.equal(hits.length, 0);
});
