import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentTable } from "@/components/student-table";
import { MessageComposer } from "@/components/message-composer";
import { StatisticsCards } from "@/components/statistics-cards";
import { AddStudentModal } from "@/components/add-student-modal";
import { EditStudentModal } from "@/components/edit-student-modal";
import { OnboardingTour, useOnboarding } from "@/components/onboarding-tour";
import { Student } from "@shared/schema";
import { Link } from "wouter";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("students");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Onboarding state
  const { shouldShowOnboarding, setShouldShowOnboarding, resetOnboarding } = useOnboarding();
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: statistics } = useQuery({
    queryKey: ["/api/statistics"],
  });

  useEffect(() => {
    // GSAP animations
    if (typeof window !== "undefined" && window.gsap) {
      window.gsap.from(".stats-card", {
        duration: 0.8,
        y: 50,
        opacity: 0,
        stagger: 0.1,
        ease: "power3.out"
      });

      window.gsap.from(".main-card", {
        duration: 1,
        y: 30,
        opacity: 0,
        stagger: 0.2,
        ease: "power2.out",
        delay: 0.3
      });

      window.gsap.from(".navbar", {
        duration: 0.8,
        y: -100,
        opacity: 0,
        ease: "power3.out"
      });
    }
  }, []);

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setShowEditModal(true);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Animate tab content
    if (typeof window !== "undefined" && window.gsap) {
      const targetPane = document.querySelector(`[data-tab="${value}"]`);
      if (targetPane) {
        window.gsap.from(targetPane.children, {
          duration: 0.6,
          y: 20,
          opacity: 0,
          stagger: 0.1,
          ease: "power2.out"
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="navbar bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg mb-6">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-white hover:text-white no-underline">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              <span className="text-xl font-bold">School WhatsApp Sender</span>
            </Link>
            <div className="flex items-center space-x-4">
              <button
                onClick={resetOnboarding}
                className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
                title="Start Onboarding Tour"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
                <span>Help</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span>Admin Panel</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4">
        {/* Statistics Cards */}
        <div className="statistics-section">
          <StatisticsCards statistics={statistics} />
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
          <TabsList className="grid w-full grid-cols-2 bg-white p-1 rounded-full shadow-lg">
            <TabsTrigger 
              value="students" 
              className="px-6 py-3 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v-2c0-1.1.9-2 2-2h3c1.1 0 2 .9 2 2v2h3v4H4zm14-8c-.8 0-1.5-.4-1.9-1L12 8l-4.1 1c-.4.6-1.1 1-1.9 1-1.3 0-2.4-1.1-2.4-2.4S4.7 5.2 6 5.2c.8 0 1.5.4 1.9 1L12 7l4.1-1c.4-.6 1.1-1 1.9-1 1.3 0 2.4 1.1 2.4 2.4S19.3 10 18 10z"/>
              </svg>
              Student Management
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className="px-6 py-3 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-teal-600 data-[state=active]:text-white transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              Send Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="tab-fade-in" data-tab="students">
            <div className="main-card student-section">
              <StudentTable 
                onEdit={handleEditStudent}
                onAddNew={() => setShowAddModal(true)}
              />
            </div>
          </TabsContent>

          <TabsContent value="messages" className="tab-fade-in" data-tab="messages">
            <div className="main-card message-section">
              <MessageComposer />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <AddStudentModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
      />
      
      <EditStudentModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal}
        student={editingStudent}
      />

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={shouldShowOnboarding}
        onClose={() => setShouldShowOnboarding(false)}
        onComplete={() => {
          setShouldShowOnboarding(false);
          // You can add celebration animation here if needed
        }}
      />
    </div>
  );
}
