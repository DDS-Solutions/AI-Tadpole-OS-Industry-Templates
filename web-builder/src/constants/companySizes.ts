export interface CompanySizeOption {
  value: string;
  label: string;
}

export const COMPANY_SIZE_OPTIONS: CompanySizeOption[] = [
  { value: '5', label: '1 - 10 employees (Small team)' },
  { value: '25', label: '11 - 49 employees (Growing business)' },
  { value: '50', label: '50 - 99 employees (Mid-sized operation)' },
  { value: '100', label: '100 - 249 employees (Scaling enterprise)' },
  { value: '500', label: '250+ employees (Large enterprise)' },
];

export function getCompanySizeOptions(currentSize?: string): CompanySizeOption[] {
  if (currentSize && !COMPANY_SIZE_OPTIONS.some(opt => opt.value === currentSize)) {
    return [...COMPANY_SIZE_OPTIONS, { value: currentSize, label: `${currentSize} employees` }];
  }
  return COMPANY_SIZE_OPTIONS;
}
