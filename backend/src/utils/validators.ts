export const validateE164 = (phone: string): boolean => {
  return /^\+[1-9]\d{6,14}$/.test(phone);
};
