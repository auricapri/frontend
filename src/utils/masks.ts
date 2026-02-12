
/**
 * Utility functions for input masking
 */

export const maskPhone = (value: string): string => {
  if (!value) return "";
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .substring(0, 14);
  }
  return numbers
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .substring(0, 15);
};

export const maskCPF = (value: string): string => {
  if (!value) return "";
  const numbers = value.replace(/\D/g, "");
  return numbers
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .substring(0, 14);
};

export const maskCNPJ = (value: string): string => {
  if (!value) return "";
  const numbers = value.replace(/\D/g, "");
  return numbers
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})/, "$1-$2")
    .substring(0, 18);
};

export const maskCPFOrCNPJ = (value: string): string => {
  if (!value) return "";
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 11) {
    return maskCPF(numbers);
  }
  return maskCNPJ(numbers);
};

export const maskCreditCard = (value: string): string => {
  if (!value) return "";
  const numbers = value.replace(/\D/g, "");
  return numbers
    .replace(/(\d{4})(\d)/, "$1 $2")
    .replace(/(\d{4})(\d)/, "$1 $2")
    .replace(/(\d{4})(\d)/, "$1 $2")
    .substring(0, 19);
};

export const maskExpiryDate = (value: string): string => {
  if (!value) return "";
  const numbers = value.replace(/\D/g, "");
  return numbers
    .replace(/(\d{2})(\d)/, "$1/$2")
    .substring(0, 5);
};

export const unmask = (value: string): string => {
  return value.replace(/\D/g, "");
};

/**
 * Validates a Brazilian CPF number
 * Returns true if valid, false otherwise
 */
export const validateCPF = (cpf: string): boolean => {
  // Remove non-digits
  const numbers = cpf.replace(/\D/g, "");

  // Must have 11 digits
  if (numbers.length !== 11) return false;

  // Reject all same digits (00000000000, 11111111111, etc.)
  if (/^(\d)\1{10}$/.test(numbers)) return false;

  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers[9])) return false;

  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers[10])) return false;

  return true;
};

export const normalizeCepDigits = (value: string): string => {
  return value.replace(/\D/g, "").slice(0, 8);
};

export const maskCep = (value: string): string => {
  const digits = normalizeCepDigits(value);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};
