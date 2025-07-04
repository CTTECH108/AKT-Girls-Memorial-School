import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";
// Using Fast2SMS API for SMS messaging

export async function registerRoutes(app: Express): Promise<Server> {
  // Storage is automatically initialized with permanent data

  // Student routes
  app.get("/api/students", async (req, res) => {
    const { search, grade } = req.query;
    
    let students = await storage.getStudents();
    
    if (search) {
      students = await storage.searchStudents(search as string);
    }
    
    if (grade && grade !== "all") {
      const gradeNum = parseInt(grade as string);
      students = students.filter(student => student.grade === gradeNum);
    }
    
    res.json(students);
  });

  app.get("/api/students/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const student = await storage.getStudent(id);
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    res.json(student);
  });

  app.post("/api/students", async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      
      // Generate student ID if not provided
      if (!validatedData.studentId) {
        const allStudents = await storage.getStudents();
        const maxId = Math.max(...allStudents.map(s => parseInt(s.studentId.replace('STU', ''))), 0);
        validatedData.studentId = `STU${String(maxId + 1).padStart(3, '0')}`;
      }
      
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Bulk restore students from backup (cookie data)
  app.post("/api/students/restore", async (req, res) => {
    try {
      const { students: backupStudents } = req.body;
      
      if (!Array.isArray(backupStudents)) {
        return res.status(400).json({ message: "Invalid backup data format" });
      }

      let restoredCount = 0;
      for (const studentData of backupStudents) {
        try {
          const validatedData = insertStudentSchema.parse(studentData);
          await storage.createStudent(validatedData);
          restoredCount++;
        } catch (error) {
          console.error("Error restoring student:", error);
          // Continue with other students even if one fails
        }
      }

      res.json({ 
        message: `Successfully restored ${restoredCount} students from backup`,
        restored: restoredCount 
      });
    } catch (error) {
      console.error("Error in restore operation:", error);
      res.status(500).json({ message: "Failed to restore students from backup" });
    }
  });

  app.put("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertStudentSchema.partial().parse(req.body);
      
      const updatedStudent = await storage.updateStudent(id, validatedData);
      
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(updatedStudent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteStudent(id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    res.json({ message: "Student deleted successfully" });
  });

  // Statistics route
  app.get("/api/statistics", async (req, res) => {
    const students = await storage.getStudents();
    const messages = await storage.getMessages();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayMessages = messages.filter(m => m.createdAt >= today);
    const sentMessages = messages.filter(m => m.status === "sent");
    const failedMessages = messages.filter(m => m.status === "failed");
    const pendingMessages = messages.filter(m => m.status === "pending");
    
    const gradeDistribution = students.reduce((acc, student) => {
      acc[student.grade] = (acc[student.grade] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    res.json({
      totalStudents: students.length,
      messagesToday: todayMessages.length,
      totalSent: sentMessages.length,
      totalFailed: failedMessages.length,
      totalPending: pendingMessages.length,
      successRate: sentMessages.length > 0 ? Math.round((sentMessages.length / (sentMessages.length + failedMessages.length)) * 100) : 100,
      gradeDistribution,
    });
  });

  // WhatsApp messaging route using UltraMsg API
  app.post("/api/send-message", async (req, res) => {
    try {
      const { content, targetType, targetGrade, excelData } = req.body;
      
      if (!targetType) {
        return res.status(400).json({ message: "Target type is required" });
      }

      let recipients = [];
      let isExcelUpload = false;

      if (targetType === "excel") {
        if (!excelData || !Array.isArray(excelData) || excelData.length === 0) {
          return res.status(400).json({ message: "Excel data is required for Excel upload" });
        }
        recipients = excelData;
        isExcelUpload = true;
      } else {
        if (!content) {
          return res.status(400).json({ message: "Content is required for regular messaging" });
        }

        if (targetType === "all") {
          recipients = await storage.getStudents();
        } else if (targetType === "grade" && targetGrade) {
          recipients = await storage.getStudentsByGrade(parseInt(targetGrade));
        } else {
          return res.status(400).json({ message: "Invalid target configuration" });
        }
      }

      // Create message record
      const message = await storage.createMessage({
        content: isExcelUpload ? "Excel upload - Student marks" : content,
        targetType,
        targetGrade: targetGrade ? parseInt(targetGrade) : null,
        recipientCount: recipients.length,
      });

      // UltraMsg WhatsApp API configuration
      const instanceId = "instance128844";
      const token = "k9tra4qq8j5m8ik9";
      const ultramsgApiUrl = `https://api.ultramsg.com/${instanceId}/messages/chat`;

      let successCount = 0;
      let failureCount = 0;

      // Send WhatsApp messages to recipients using UltraMsg API
      for (const recipient of recipients) {
        try {
          let messageBody;
          let toNumber;

          if (isExcelUpload) {
            // For Excel upload, create personalized message with student marks
            // Find student name column (flexible matching)
            const nameColumns = Object.keys(recipient).filter(key => 
              key.toLowerCase().includes('name') || key.toLowerCase().includes('student')
            );
            const studentName = nameColumns.length > 0 ? recipient[nameColumns[0]] || "Student" : "Student";
            
            // Find phone number column (flexible matching)
            const phoneColumns = Object.keys(recipient).filter(key => 
              key.toLowerCase().includes('phone') || 
              key.toLowerCase().includes('mobile') ||
              key.toLowerCase().includes('number')
            );
            toNumber = phoneColumns.length > 0 ? recipient[phoneColumns[0]] || "" : "";
            toNumber = toNumber.toString().replace(/[^\d]/g, "");
            
            // Build subject marks string from all non-name, non-phone columns
            let subjectMarks = "";
            const excludeColumns = [...nameColumns, ...phoneColumns, "S.No", "s.no", "Sl.No", "sl.no", "Sr.No", "sr.no"];
            
            Object.keys(recipient).forEach(column => {
              // Skip excluded columns (name, phone, serial number)
              if (excludeColumns.some(exc => exc.toLowerCase() === column.toLowerCase())) {
                return;
              }
              
              const mark = recipient[column];
              if (mark !== undefined && mark !== null && mark !== "" && mark !== 0) {
                subjectMarks += `${column}: ${mark}\n`;
              }
            });

            messageBody = `Student Name: ${studentName}\n\nSubject Marks:\n${subjectMarks.trim()}`;
          } else {
            // Regular messaging
            messageBody = content;
            toNumber = recipient.phone.replace(/[^\d]/g, "");
          }

          // Validate phone number
          if (!toNumber || toNumber.length < 10) {
            console.error(`Invalid phone number for ${isExcelUpload ? studentName : recipient.name}: ${toNumber}`);
            failureCount++;
            continue;
          }

          // Format phone number for UltraMsg (91 followed by 10 digits)
          if (toNumber.startsWith("+")) {
            toNumber = toNumber.substring(1);
          }
          if (!toNumber.startsWith("91") && toNumber.length === 10) {
            toNumber = "91" + toNumber;
          }
          
          console.log(`Sending WhatsApp to ${toNumber}: ${messageBody.substring(0, 50)}...`);
          
          const response = await fetch(ultramsgApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              token: token,
              to: toNumber,
              body: messageBody
            })
          });

          const result = await response.json();
          
          if (result.sent === true || result.id) {
            successCount++;
          } else {
            failureCount++;
            console.error(`Failed to send WhatsApp message to ${recipient.phone}:`, result.message || 'Unknown error');
          }
        } catch (error) {
          console.error(`Failed to send WhatsApp message to ${recipient.phone}:`, error);
          failureCount++;
        }
      }

      // Update message status
      const finalStatus = failureCount === 0 ? "sent" : successCount > 0 ? "partial" : "failed";
      await storage.updateMessageStatus(message.id, finalStatus);

      res.json({
        message: "WhatsApp sending completed",
        totalRecipients: recipients.length,
        successCount,
        failureCount,
        status: finalStatus,
      });
    } catch (error) {
      console.error("Error sending WhatsApp messages:", error);
      res.status(500).json({ message: "Failed to send WhatsApp messages" });
    }
  });

  // Messages history route
  app.get("/api/messages", async (req, res) => {
    const messages = await storage.getMessages();
    res.json(messages);
  });

  const httpServer = createServer(app);
  return httpServer;
}
