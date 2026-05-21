/**
 * Format price with currency
 */
export const formatPrice = (amount, currency = 'EGP') => {
  if (!amount) return 'N/A';
  return `${Number(amount).toLocaleString()} ${currency}`;
};

/**
 * Format date to readable string
 */
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

/**
 * Truncate text to max length
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Role display names
 */
export const roleLabels = {
  student: 'Student',
  parent: 'Parent',
  broker: 'Broker',
  admin: 'Admin',
};

/**
 * Property type labels
 */
export const propertyTypeLabels = {
  studio: 'Studio',
  apartment: 'Apartment',
  'shared-room': 'Shared Room',
  'single-room': 'Single Room',
  villa: 'Villa',
  dorm: 'Dorm',
};
