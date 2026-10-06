import assert from 'node:assert/strict';
import test from 'node:test';

import { validateSignup, type SignupFormValues } from '../signup';

const valid: SignupFormValues = {
  firstName: 'Jamie',
  lastName: 'Smith',
  email: 'jamie@example.com',
  password: 'SecurePass1!',
  confirmPassword: 'SecurePass1!',
  agreeToTerms: true,
  agreeToPrivacy: true,
};

test('accepts complete personal-account signup data', () => {
  assert.equal(validateSignup(valid), null);
});

test('requires every field and legal consent', () => {
  assert.match(validateSignup({ ...valid, firstName: '' }) || '', /required/);
  assert.match(validateSignup({ ...valid, agreeToTerms: false }) || '', /agree/);
  assert.match(validateSignup({ ...valid, agreeToPrivacy: false }) || '', /agree/);
});

test('requires a valid email and matching strong passwords', () => {
  assert.match(validateSignup({ ...valid, email: 'invalid' }) || '', /valid email/);
  assert.match(validateSignup({ ...valid, password: 'Short1!', confirmPassword: 'Short1!' }) || '', /12/);
  assert.match(validateSignup({ ...valid, password: 'SecurePassword!', confirmPassword: 'SecurePassword!' }) || '', /number/);
  assert.match(validateSignup({ ...valid, password: 'SecurePassword1', confirmPassword: 'SecurePassword1' }) || '', /symbol/);
  assert.match(validateSignup({ ...valid, confirmPassword: 'Different1!' }) || '', /match/);
});
