import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";
import { saveStudentsToCookie, loadStudentsFromCookie, hasCookieBackup } from "@/lib/cookie-storage";
import { Student } from "@shared/schema";
import { Pencil, Trash2, Plus, Search, FileSpreadsheet, FileText } from "lucide-react";

interface StudentTableProps {
  onEdit: (student: Student) => void;
  onAddNew: () => void;
}

export function StudentTable({ onEdit, onAddNew }: StudentTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const { toast } = useToast();

  const itemsPerPage = 10;

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students", { search: searchQuery, grade: selectedGrade }],
  });

  // Auto-save students to cookie backup whenever data changes
  useEffect(() => {
    if (students.length > 0) {
      saveStudentsToCookie(students);
    }
  }, [students]);

  const deleteStudentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
      setDeletingStudent(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    },
  });

  const handleExportExcel = () => {
    exportToExcel(students, "students");
    toast({
      title: "Export Successful",
      description: "Student data exported to Excel",
    });
  };

  const handleExportPDF = () => {
    exportToPDF(students, "Student Database");
    toast({
      title: "Export Successful", 
      description: "Student data exported to PDF",
    });
  };

  const getGradeBadgeColor = (grade: number) => {
    const colors = [
      "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500",
      "bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-pink-500",
      "bg-gray-500", "bg-teal-500", "bg-cyan-500", "bg-lime-500"
    ];
    return colors[(grade - 1) % colors.length];
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500"
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Filter and paginate students
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchQuery || 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phone.includes(searchQuery) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGrade = selectedGrade === "all" || student.grade.toString() === selectedGrade;
    
    return matchesSearch && matchesGrade;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading students...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="table-container">
      <CardHeader className="bg-white border-b-0 pt-6 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h4 className="text-xl font-semibold flex items-center gap-2">
              <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v-2c0-1.1.9-2 2-2h3c1.1 0 2 .9 2 2v2h3v4H4zm14-8c-.8 0-1.5-.4-1.9-1L12 8l-4.1 1c-.4.6-1.1 1-1.9 1-1.3 0-2.4-1.1-2.4-2.4S4.7 5.2 6 5.2c.8 0 1.5.4 1.9 1L12 7l4.1-1c.4-.6 1.1-1 1.9-1 1.3 0 2.4 1.1 2.4 2.4S19.3 10 18 10z"/>
              </svg>
              Student Database
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-1" />
              Export Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileText className="w-4 h-4 mr-1" />
              Export PDF
            </Button>
            <Button onClick={onAddNew} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Student
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students by name, grade, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 search-box"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger>
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                  <SelectItem key={grade} value={grade.toString()}>
                    Grade {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Students Table */}
        <div className="table-container rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-blue-600 to-purple-600 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600">
                <TableHead className="text-white font-semibold">S.No</TableHead>
                <TableHead className="text-white font-semibold">Student Name</TableHead>
                <TableHead className="text-white font-semibold">Grade</TableHead>
                <TableHead className="text-white font-semibold">Phone Number</TableHead>
                <TableHead className="text-white font-semibold">Added Date</TableHead>
                <TableHead className="text-white font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchQuery || selectedGrade ? "No students found matching your criteria." : "No students added yet."}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStudents.map((student, index) => (
                  <TableRow key={student.id} className="hover:bg-muted/50">
                    <TableCell className="font-semibold">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(student.name)} text-white flex items-center justify-center font-semibold text-sm`}>
                          {getInitials(student.name)}
                        </div>
                        <div>
                          <div className="font-semibold">{student.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Student ID: {student.studentId}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getGradeBadgeColor(student.grade)} text-white badge-grade`}>
                        Grade {student.grade}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {student.phone}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(student)}
                          className="btn-action"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingStudent(student)}
                              className="btn-action text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Student</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {student.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteStudentMutation.mutate(student.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
