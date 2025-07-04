import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Message } from "@shared/schema";

export function MessageComposer() {
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<"all" | "grade" | "excel">("all");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const { toast } = useToast();

  const { data: students = [] } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: statistics } = useQuery({
    queryKey: ["/api/statistics"],
  });

  const { data: recentMessages = [] } = useQuery({
    queryKey: ["/api/messages"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; targetType: string; targetGrade?: string; excelData?: any[] }) => {
      const response = await apiRequest("POST", "/api/send-message", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: "Messages Sent Successfully",
        description: `Sent to ${data.totalRecipients} recipients. ${data.successCount} successful, ${data.failureCount} failed.`,
      });
      setMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Messages",
        description: error.message || "An error occurred while sending messages",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    setExcelFile(file);
    
    // Parse Excel file
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        toast({
          title: "Empty File",
          description: "No data found in the Excel file",
          variant: "destructive",
        });
        return;
      }

      // Validate essential columns
      const firstRow = jsonData[0] as any;
      const columns = Object.keys(firstRow);
      
      const hasStudentName = columns.some(col => 
        col.toLowerCase().includes('name') || 
        col.toLowerCase().includes('student')
      );
      
      const hasPhoneNumber = columns.some(col => 
        col.toLowerCase().includes('phone') || 
        col.toLowerCase().includes('mobile') ||
        col.toLowerCase().includes('number')
      );
      
      if (!hasStudentName) {
        toast({
          title: "Missing Student Name Column",
          description: "Excel file must contain a column with 'name' or 'student' in the title",
          variant: "destructive",
        });
        return;
      }
      
      if (!hasPhoneNumber) {
        toast({
          title: "Missing Phone Number Column", 
          description: "Excel file must contain a column with 'phone', 'mobile' or 'number' in the title",
          variant: "destructive",
        });
        return;
      }
      
      setExcelData(jsonData);
      toast({
        title: "File Uploaded Successfully",
        description: `Loaded ${jsonData.length} student records with ${columns.length} columns`,
      });
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to parse Excel file. Please check the format.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = () => {
    if (targetType === "excel") {
      if (!excelFile || excelData.length === 0) {
        toast({
          title: "Excel File Required",
          description: "Please upload an Excel file with student data",
          variant: "destructive",
        });
        return;
      }

      sendMessageMutation.mutate({
        content: "",
        targetType,
        excelData,
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message before sending",
        variant: "destructive",
      });
      return;
    }

    if (targetType === "grade" && !selectedGrade) {
      toast({
        title: "Grade Required",
        description: "Please select a grade when sending to specific grade",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      content: message,
      targetType,
      targetGrade: targetType === "grade" ? selectedGrade : undefined,
    });
  };

  const getTargetCount = () => {
    if (targetType === "excel") {
      return excelData.length;
    }
    if (targetType === "all") {
      return (students as any[]).length;
    }
    if (selectedGrade) {
      return (students as any[]).filter((s: any) => s.grade.toString() === selectedGrade).length;
    }
    return 0;
  };

  const getGradeStats = () => {
    const gradeStats: Record<number, number> = {};
    students.forEach(student => {
      gradeStats[student.grade] = (gradeStats[student.grade] || 0) + 1;
    });
    return gradeStats;
  };

  const gradeStats = getGradeStats();

  const getMessageStatus = (status: string) => {
    switch (status) {
      case "sent":
        return { color: "bg-green-500", text: "Sent" };
      case "pending":
        return { color: "bg-yellow-500", text: "Pending" };
      case "failed":
        return { color: "bg-red-500", text: "Failed" };
      case "partial":
        return { color: "bg-orange-500", text: "Partial" };
      default:
        return { color: "bg-gray-500", text: "Unknown" };
    }
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return "Now";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Message Composer */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="bg-white">
            <CardTitle className="flex items-center gap-2 text-xl">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l3 3 3-3h6c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 9h-2v2h-2v-2H9V9h2V7h2v2h2v2z"/>
              </svg>
              Compose WhatsApp Message
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Message Content */}
            {targetType !== "excel" && (
              <div className="space-y-2">
                <Label className="font-semibold">Message Content</Label>
                <div className="message-area p-4 rounded-lg border-2 border-dashed border-gray-300 focus-within:border-blue-500 focus-within:bg-blue-50/50 transition-all">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here... (You can use emojis 😊)"
                    rows={6}
                    className="border-0 shadow-none resize-none focus-visible:ring-0"
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      Messages will be sent via UltraMsg WhatsApp API
                    </div>
                    <div>{message.length}/1000 characters</div>
                  </div>
                </div>
              </div>
            )}

            {targetType === "excel" && excelData.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">Excel Data Preview</Label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-600 mb-3">
                    Personalized messages will be sent automatically with detected columns:
                  </p>
                  
                  {/* Show detected columns */}
                  <div className="mb-3 p-2 bg-blue-50 rounded text-sm">
                    <strong>Detected Columns:</strong> {Object.keys(excelData[0]).join(", ")}
                  </div>
                  
                  {/* Show message format preview */}
                  <div className="bg-white p-3 rounded border text-sm">
                    <strong>Message Format:</strong><br/>
                    Student Name: [Detected Name Column]<br/>
                    <br/>
                    <strong>Subject Marks:</strong><br/>
                    [All Subject Columns with their marks]
                  </div>
                  
                  {/* Show first record preview */}
                  <div className="mt-3 text-sm text-gray-600">
                    <strong>First Student:</strong> {
                      (() => {
                        const firstRow = excelData[0];
                        const nameColumn = Object.keys(firstRow).find(key => 
                          key.toLowerCase().includes('name') || key.toLowerCase().includes('student')
                        );
                        return nameColumn ? firstRow[nameColumn] : "Name not detected";
                      })()
                    }
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Records to process:</strong> {excelData.length}
                  </div>
                </div>
              </div>
            )}

            {/* Target Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="font-semibold">Send To</Label>
                <RadioGroup value={targetType} onValueChange={(value: "all" | "grade" | "excel") => setTargetType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v-2c0-1.1.9-2 2-2h3c1.1 0 2 .9 2 2v2h3v4H4zm14-8c-.8 0-1.5-.4-1.9-1L12 8l-4.1 1c-.4.6-1.1 1-1.9 1-1.3 0-2.4-1.1-2.4-2.4S4.7 5.2 6 5.2c.8 0 1.5.4 1.9 1L12 7l4.1-1c.4-.6 1.1-1 1.9-1 1.3 0 2.4 1.1 2.4 2.4S19.3 10 18 10z"/>
                      </svg>
                      All Students (1-12)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="grade" id="grade" />
                    <Label htmlFor="grade" className="flex items-center gap-2 cursor-pointer">
                      <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                      </svg>
                      Specific Grade
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="excel" id="excel" />
                    <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      </svg>
                      Excel Upload (Student Marks)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {targetType === "grade" && (
                <div className="space-y-2">
                  <Label className="font-semibold">Select Grade</Label>
                  <Select 
                    value={selectedGrade} 
                    onValueChange={setSelectedGrade}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose Grade..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                        <SelectItem key={grade} value={grade.toString()}>
                          Grade {grade} ({gradeStats[grade] || 0} students)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {targetType === "excel" && (
                <div className="space-y-2">
                  <Label className="font-semibold">Upload Excel File</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="excel-upload"
                    />
                    <label htmlFor="excel-upload" className="cursor-pointer">
                      <div className="space-y-2">
                        <svg className="w-12 h-12 text-gray-400 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                        </svg>
                        <div className="text-gray-600">
                          <p className="font-medium">Click to upload Excel file</p>
                          <p className="text-sm">Supports .xlsx and .xls files</p>
                        </div>
                      </div>
                    </label>
                    {excelFile && (
                      <div className="mt-3 p-2 bg-green-50 rounded border text-green-800 text-sm">
                        ✓ {excelFile.name} ({excelData.length} records loaded)
                      </div>
                    )}
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                    <p className="font-medium mb-1">Excel Requirements:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Must have a column containing "name" or "student" (for student names)</li>
                      <li>• Must have a column containing "phone", "mobile" or "number" (for contact)</li>
                      <li>• All other columns will be treated as subject marks/data</li>
                      <li>• System automatically detects and maps columns</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Send Button */}
            <div className="space-y-4">
              <Button 
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending || (targetType !== "excel" && !message.trim()) || (targetType === "excel" && excelData.length === 0)}
                className="w-full sms-btn text-lg py-3"
              >
                {sendMessageMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending Messages...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    Send WhatsApp Message
                    <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-sm">
                      ({getTargetCount()} recipients)
                    </span>
                  </>
                )}
              </Button>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h6 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
                Message Preview
              </h6>
              <div className="bg-white p-3 rounded border min-h-[80px] text-sm">
                {message || <span className="text-gray-400 italic">Your message will appear here...</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Quick Stats */}
        <Card>
          <CardHeader className="bg-white pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
              </svg>
              Messaging Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="border-r">
                <div className="text-2xl font-bold text-green-600">{statistics?.totalSent || 0}</div>
                <div className="text-xs text-muted-foreground">Sent Today</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{statistics?.totalSent || 0}</div>
                <div className="text-xs text-muted-foreground">Delivered</div>
              </div>
            </div>
            <hr className="my-4" />
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="border-r">
                <div className="text-2xl font-bold text-yellow-600">{statistics?.totalPending || 0}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{statistics?.totalFailed || 0}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader className="bg-white pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
              </svg>
              Recent Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentMessages.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No messages sent yet
                </div>
              ) : (
                recentMessages.slice(0, 5).map((msg: Message) => {
                  const status = getMessageStatus(msg.status);
                  return (
                    <div key={msg.id} className="p-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {msg.content.slice(0, 30)}...
                          </div>
                          <div className="text-xs text-muted-foreground">
                            To {msg.targetType === "all" ? "All Students" : `Grade ${msg.targetGrade}`} • {msg.recipientCount} recipients
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <Badge className={`${status.color} text-white text-xs`}>
                            {status.text}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatTimeAgo(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
