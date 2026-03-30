import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ProjectDocument from "./pages/ProjectDocument";
import NotFound from "./pages/NotFound";

import ReceptionistDashboard from "./pages/receptionist/Dashboard";
import RegisterPatient from "./pages/receptionist/RegisterPatient";
import PatientList from "./pages/receptionist/PatientList";
import BookAppointment from "./pages/receptionist/BookAppointment";
import Billing from "./pages/receptionist/Billing";

import DoctorDashboard from "./pages/doctor/Dashboard";
import SearchPatient from "./pages/doctor/SearchPatient";
import PatientHistory from "./pages/doctor/PatientHistory";
import AddPrescription from "./pages/doctor/AddPrescription";
import ViewPrescriptions from "./pages/doctor/ViewPrescriptions";

import AdminDashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import Reports from "./pages/admin/Reports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/project-document" element={<ProjectDocument />} />

            <Route path="/receptionist" element={<ReceptionistDashboard />} />
            <Route path="/receptionist/register" element={<RegisterPatient />} />
            <Route path="/receptionist/patients" element={<PatientList />} />
            <Route path="/receptionist/appointment" element={<BookAppointment />} />
            <Route path="/receptionist/billing" element={<Billing />} />

            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/doctor/search" element={<SearchPatient />} />
            <Route path="/doctor/history" element={<PatientHistory />} />
            <Route path="/doctor/prescribe" element={<AddPrescription />} />
            <Route path="/doctor/prescriptions" element={<ViewPrescriptions />} />

            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/reports" element={<Reports />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
