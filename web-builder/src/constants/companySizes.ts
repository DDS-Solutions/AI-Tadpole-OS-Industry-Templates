export interface CompanySizeOption {
  value: string;
  label: string;
}

export const COMPANY_SIZE_OPTIONS: CompanySizeOption[] = [
  { value: '5', label: '1 - 10 employees (Small team)' },
  { value: '25', label: '11 - 50 employees (Growing business)' },
  { value: '50', label: '50 employees' },
  { value: '100', label: '51 - 250 employees (Mid-sized operation)' },
  { value: '500', label: '250+ employees (Enterprise)' },
];
