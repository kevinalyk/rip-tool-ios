export type SignupFormValues = {
  clientName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
};

export function validateSignup(values: SignupFormValues): string | null {
  if (![values.clientName, values.firstName, values.lastName, values.email, values.password, values.confirmPassword].every((value) => value.trim())) {
    return 'All fields are required.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) return 'Please enter a valid email address.';
  if (values.password.length < 12) return 'Password must be at least 12 characters long.';
  if (!/\d/.test(values.password)) return 'Password must contain at least one number.';
  if (!/[a-zA-Z]/.test(values.password)) return 'Password must contain at least one letter.';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(values.password)) return 'Password must contain at least one symbol.';
  if (values.password !== values.confirmPassword) return 'Passwords do not match.';
  if (!values.agreeToTerms || !values.agreeToPrivacy) {
    return 'You must agree to the Terms of Service and Privacy Policy.';
  }
  return null;
}
