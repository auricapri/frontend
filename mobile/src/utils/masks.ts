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

export const normalizeCepDigits = (value: string): string => {
  return value.replace(/\D/g, "").slice(0, 8);
};

export const maskCep = (value: string): string => {
  const digits = normalizeCepDigits(value);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};
