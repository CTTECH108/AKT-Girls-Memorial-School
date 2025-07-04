// Cookie-based student data backup storage
import { Student } from "@shared/schema";

const COOKIE_NAME = "student_data_backup";
const COOKIE_EXPIRY_DAYS = 365;

// Save students to cookie
export function saveStudentsToCookie(students: Student[]): void {
  try {
    const data = JSON.stringify(students);
    const date = new Date();
    date.setTime(date.getTime() + (COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    
    // Split large data into multiple cookies if needed (cookies have size limits)
    const maxChunkSize = 3000; // Safe size for cookie chunks
    const chunks = [];
    
    for (let i = 0; i < data.length; i += maxChunkSize) {
      chunks.push(data.slice(i, i + maxChunkSize));
    }
    
    // Clear existing chunks
    clearStudentCookies();
    
    // Save chunks
    chunks.forEach((chunk, index) => {
      document.cookie = `${COOKIE_NAME}_${index}=${encodeURIComponent(chunk)}; ${expires}; path=/`;
    });
    
    // Save chunk count
    document.cookie = `${COOKIE_NAME}_count=${chunks.length}; ${expires}; path=/`;
    
    console.log(`Saved ${students.length} students to cookie backup (${chunks.length} chunks)`);
  } catch (error) {
    console.error('Error saving students to cookie:', error);
  }
}

// Load students from cookie
export function loadStudentsFromCookie(): Student[] {
  try {
    const countCookie = getCookie(`${COOKIE_NAME}_count`);
    if (!countCookie) return [];
    
    const chunkCount = parseInt(countCookie);
    let data = '';
    
    // Reconstruct data from chunks
    for (let i = 0; i < chunkCount; i++) {
      const chunk = getCookie(`${COOKIE_NAME}_${i}`);
      if (chunk) {
        data += decodeURIComponent(chunk);
      }
    }
    
    if (!data) return [];
    
    const students = JSON.parse(data);
    console.log(`Loaded ${students.length} students from cookie backup`);
    return students.map((s: any) => ({
      ...s,
      createdAt: new Date(s.createdAt)
    }));
  } catch (error) {
    console.error('Error loading students from cookie:', error);
    return [];
  }
}

// Clear all student cookies
function clearStudentCookies(): void {
  // Clear up to 20 possible chunks (should be more than enough)
  for (let i = 0; i < 20; i++) {
    document.cookie = `${COOKIE_NAME}_${i}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
  document.cookie = `${COOKIE_NAME}_count=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// Helper function to get cookie value
function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Check if cookie backup exists
export function hasCookieBackup(): boolean {
  return getCookie(`${COOKIE_NAME}_count`) !== null;
}