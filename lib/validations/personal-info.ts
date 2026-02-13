import { z } from 'zod';

// Canadian SIN validation (Luhn algorithm check)
function isValidSIN(sin: string): boolean {
  const digits = sin.replace(/\D/g, '');
  if (digits.length !== 9) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(digits[i], 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

// Canadian postal code regex
const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

// Phone number regex (North American)
const phoneRegex = /^[\d\s()+-]{10,}$/;

export const personalInfoSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  sin: z
    .string()
    .min(1, 'Social Insurance Number is required')
    .refine((val) => isValidSIN(val), {
      message: 'Please enter a valid SIN',
    }),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((val) => {
      const date = new Date(val);
      const today = new Date();
      const minAge = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
      const maxAge = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
      return date >= minAge && date <= maxAge;
    }, 'You must be at least 16 years old to file taxes'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(phoneRegex, 'Please enter a valid phone number'),
  province: z.string().min(1, 'Province is required'),
  maritalStatus: z.string().min(1, 'Marital status is required'),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    province: z.string().min(1, 'Province is required'),
    postalCode: z
      .string()
      .min(1, 'Postal code is required')
      .regex(postalCodeRegex, 'Please enter a valid Canadian postal code (e.g., A1A 1A1)'),
  }),
});

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
