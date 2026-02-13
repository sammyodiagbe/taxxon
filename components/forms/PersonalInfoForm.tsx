'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useTaxFiling } from '@/contexts/TaxFilingContext';
import { PROVINCES, MARITAL_STATUSES, Province, PersonalInfo } from '@/types/tax-filing';
import { formatSIN, formatPostalCode, formatPhoneNumber } from '@/lib/utils';
import { personalInfoSchema } from '@/lib/validations/personal-info';

interface PersonalInfoFormProps {
  onValidationChange: (isValid: boolean) => void;
}

export function PersonalInfoForm({ onValidationChange }: PersonalInfoFormProps) {
  const { currentFiling, updatePersonalInfo } = useTaxFiling();
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const personalInfo = currentFiling?.personalInfo;

  const provinceOptions = Object.entries(PROVINCES).map(([value, label]) => ({
    value,
    label,
  }));

  const maritalStatusOptions = Object.entries(MARITAL_STATUSES).map(([value, label]) => ({
    value,
    label,
  }));

  useEffect(() => {
    if (personalInfo) {
      const result = personalInfoSchema.safeParse(personalInfo);
      onValidationChange(result.success);
    }
  }, [personalInfo, onValidationChange]);

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    let formattedValue = value;

    if (field === 'sin') {
      formattedValue = formatSIN(value);
    } else if (field === 'phone') {
      formattedValue = formatPhoneNumber(value);
    }

    updatePersonalInfo({ [field]: formattedValue });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleAddressChange = (field: keyof PersonalInfo['address'], value: string) => {
    let formattedValue = value;

    if (field === 'postalCode') {
      formattedValue = formatPostalCode(value);
    }

    updatePersonalInfo({
      address: {
        ...personalInfo?.address,
        street: personalInfo?.address?.street || '',
        city: personalInfo?.address?.city || '',
        province: personalInfo?.address?.province || '',
        postalCode: personalInfo?.address?.postalCode || '',
        [field]: formattedValue,
      },
    });

    setErrors((prev) => ({ ...prev, [`address.${field}`]: undefined }));
  };

  const handleBlur = (field: string) => {
    const result = personalInfoSchema.safeParse(personalInfo);
    if (!result.success) {
      const fieldError = result.error.issues.find((err) => err.path.join('.') === field);
      if (fieldError) {
        setErrors((prev) => ({ ...prev, [field]: fieldError.message }));
      }
    }
  };

  if (!personalInfo) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              value={personalInfo.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              onBlur={() => handleBlur('firstName')}
              error={errors.firstName}
              placeholder="John"
            />
            <Input
              label="Last name"
              value={personalInfo.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              onBlur={() => handleBlur('lastName')}
              error={errors.lastName}
              placeholder="Doe"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Social Insurance Number"
              value={personalInfo.sin}
              onChange={(e) => handleChange('sin', e.target.value)}
              onBlur={() => handleBlur('sin')}
              error={errors.sin}
              placeholder="XXX-XXX-XXX"
              maxLength={11}
            />
            <Input
              label="Date of birth"
              type="date"
              value={personalInfo.dateOfBirth}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              onBlur={() => handleBlur('dateOfBirth')}
              error={errors.dateOfBirth}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Email"
              type="email"
              value={personalInfo.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              error={errors.email}
              placeholder="you@example.com"
            />
            <Input
              label="Phone"
              type="tel"
              value={personalInfo.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              error={errors.phone}
              placeholder="(XXX) XXX-XXXX"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Province"
              options={provinceOptions}
              value={personalInfo.province}
              onChange={(e) => handleChange('province', e.target.value)}
              error={errors.province}
              placeholder="Select province"
            />
            <Select
              label="Marital status"
              options={maritalStatusOptions}
              value={personalInfo.maritalStatus}
              onChange={(e) => handleChange('maritalStatus', e.target.value)}
              error={errors.maritalStatus}
              placeholder="Select status"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Street address"
            value={personalInfo.address.street}
            onChange={(e) => handleAddressChange('street', e.target.value)}
            onBlur={() => handleBlur('address.street')}
            error={errors['address.street']}
            placeholder="123 Main Street"
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="City"
              value={personalInfo.address.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              onBlur={() => handleBlur('address.city')}
              error={errors['address.city']}
              placeholder="Toronto"
            />
            <Select
              label="Province"
              options={provinceOptions}
              value={personalInfo.address.province}
              onChange={(e) => handleAddressChange('province', e.target.value as Province)}
              error={errors['address.province']}
              placeholder="Select"
            />
            <Input
              label="Postal code"
              value={personalInfo.address.postalCode}
              onChange={(e) => handleAddressChange('postalCode', e.target.value)}
              onBlur={() => handleBlur('address.postalCode')}
              error={errors['address.postalCode']}
              placeholder="A1A 1A1"
              maxLength={7}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
