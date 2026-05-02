import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Login from "./pages/Login";
import ProjectDocument from "./pages/ProjectDocument";
import NotFound from "./pages/NotFound";

import ReceptionistDashboard from "./pages/receptionist/Dashboard";
import RegisterPatient from "./pages/receptionist/RegisterPatient";
import PatientList from "./pages/receptionist/PatientList";
import PatientProfile from "./pages/receptionist/PatientProfile.tsx";
import BookAppointment from "./pages/receptionist/BookAppointment";
import Billing from "./pages/receptionist/Billing";
import RoomOccupancy from "./pages/receptionist/RoomOccupancy";

import DoctorDashboard from "./pages/doctor/Dashboard";
import SearchPatient from "./pages/doctor/SearchPatient";
import PatientHistory from "./pages/doctor/PatientHistory";
import ViewPrescriptions from "./pages/doctor/ViewPrescriptions";
import WritePrescription from "./pages/doctor/WritePrescription";

import AdminDashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import Reports from "./pages/admin/Reports";
import ClinicSettings from "./pages/admin/ClinicSettings";
import PharmacyDashboard from "./pages/pharmacy/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/project-document" element={<ProjectDocument />} />

            {/* Receptionist */}
            <Route path="/receptionist" element={<ProtectedRoute allowedRoles={["receptionist"]}><ReceptionistDashboard /></ProtectedRoute>} />
            <Route path="/receptionist/register" element={<ProtectedRoute allowedRoles={["receptionist"]}><RegisterPatient /></ProtectedRoute>} />
            <Route path="/receptionist/patients" element={<ProtectedRoute allowedRoles={["receptionist"]}><PatientList /></ProtectedRoute>} />
            <Route path="/receptionist/patient/:patientId" element={<ProtectedRoute allowedRoles={["receptionist"]}><PatientProfile /></ProtectedRoute>} />
            <Route path="/receptionist/appointment" element={<ProtectedRoute allowedRoles={["receptionist"]}><BookAppointment /></ProtectedRoute>} />
            <Route path="/receptionist/billing" element={<ProtectedRoute allowedRoles={["receptionist"]}><Billing /></ProtectedRoute>} />
            <Route path="/receptionist/rooms" element={<ProtectedRoute allowedRoles={["receptionist"]}><RoomOccupancy /></ProtectedRoute>} />

            {/* Doctor */}
            <Route path="/doctor" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorDashboard /></ProtectedRoute>} />
            <Route path="/doctor/write-rx" element={<ProtectedRoute allowedRoles={["doctor"]}><WritePrescription /></ProtectedRoute>} />
            <Route path="/doctor/search" element={<ProtectedRoute allowedRoles={["doctor"]}><SearchPatient /></ProtectedRoute>} />
            <Route path="/doctor/history" element={<ProtectedRoute allowedRoles={["doctor"]}><PatientHistory /></ProtectedRoute>} />
            <Route path="/doctor/prescriptions" element={<ProtectedRoute allowedRoles={["doctor"]}><ViewPrescriptions /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["admin"]}><Reports /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><ClinicSettings /></ProtectedRoute>} />

            {/* Pharmacy */}
            <Route path="/pharmacy" element={<ProtectedRoute allowedRoles={["pharmacy"]}><PharmacyDashboard /></ProtectedRoute>} />
            <Route path="/pharmacy/dashboard" element={<ProtectedRoute allowedRoles={["pharmacy"]}><PharmacyDashboard /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
