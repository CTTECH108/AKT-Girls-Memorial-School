// Automatic data recovery system
import { loadStudentsFromCookie, hasCookieBackup } from "./cookie-storage";
import { apiRequest } from "./queryClient";
import { Student } from "@shared/schema";

// Check if server data is missing and recover from cookie if needed
export async function checkAndRecoverData(): Promise<boolean> {
  try {
    // Check current server data
    const response = await fetch('/api/students');
    const serverStudents: Student[] = await response.json();
    
    // If server has no data but we have cookie backup, restore it
    if (serverStudents.length === 0 && hasCookieBackup()) {
      console.log("Server data is empty, attempting to restore from cookie backup...");
      
      const cookieStudents = loadStudentsFromCookie();
      if (cookieStudents.length > 0) {
        try {
          const restoreResponse = await apiRequest("POST", "/api/students/restore", {
            students: cookieStudents.map(s => ({
              name: s.name,
              grade: s.grade,
              phone: s.phone,
              studentId: s.studentId,
              notes: s.notes
            }))
          });
          
          const result = await restoreResponse.json();
          console.log(`Recovery successful: ${result.message}`);
          return true;
        } catch (error) {
          console.error("Failed to restore from cookie backup:", error);
          return false;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error in data recovery check:", error);
    return false;
  }
}

// Initialize data recovery on app start
export function initializeDataRecovery(): void {
  // Check for data recovery on page load
  setTimeout(() => {
    checkAndRecoverData().then(recovered => {
      if (recovered) {
        // Refresh the page to show recovered data
        window.location.reload();
      }
    });
  }, 1000); // Wait 1 second after app loads
}