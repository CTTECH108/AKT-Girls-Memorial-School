export interface WhatsAppMessage {
  to: string;
  body: string;
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 91, keep as is
  if (cleaned.startsWith('91')) {
    return cleaned;
  }
  
  // If it starts with 0, replace with 91
  if (cleaned.startsWith('0')) {
    return `91${cleaned.substring(1)}`;
  }
  
  // If it's 10 digits, add 91 prefix
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  
  // Return as is
  return cleaned;
}

export function validatePhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Indian phone numbers should be 91 followed by 10 digits
  return /^91\d{10}$/.test(formatted);
}

export function createWhatsAppMessage(content: string, phoneNumber: string): WhatsAppMessage {
  return {
    to: formatPhoneNumber(phoneNumber),
    body: content
  };
}

export function validateMessage(content: string): { isValid: boolean; error?: string } {
  if (!content.trim()) {
    return { isValid: false, error: "Message content is required" };
  }
  
  if (content.length > 1000) {
    return { isValid: false, error: "Message is too long (max 1000 characters for WhatsApp)" };
  }
  
  return { isValid: true };
}
