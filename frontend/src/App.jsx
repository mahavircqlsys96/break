import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AdminLayout } from "./layout/AdminLayout";
import { RequireAuth } from "./auth/AuthContext";
import { LoginPage } from "./modules/auth/LoginPage";
import { ForgotPasswordPage } from "./modules/auth/ForgotPasswordPage";
import { DashboardPage } from "./modules/dashboard/DashboardPage";
import { GuestsPage } from "./modules/guests/GuestsPage";
import { GuestDetailPage } from "./modules/guests/GuestDetailPage";
import { HostsPage } from "./modules/hosts/HostsPage";
import { HostDetailPage } from "./modules/hosts/HostDetailPage";
import { PropertiesPage } from "./modules/properties/PropertiesPage";
import { PropertyDetailPage } from "./modules/properties/PropertyDetailPage";
import { PropertyFormPage } from "./modules/properties/PropertyFormPage";
import { BookingsPage } from "./modules/bookings/BookingsPage";
import { BookingDetailPage } from "./modules/bookings/BookingDetailPage";
import { PaymentsPage } from "./modules/payments/PaymentsPage";
import { ReviewsPage } from "./modules/reviews/ReviewsPage";
import { SupportPage } from "./modules/support/SupportPage";
import { EnquiriesPage } from "./modules/enquiries/EnquiriesPage";
import { NotificationsPage } from "./modules/notifications/NotificationsPage";
import { MasterDataPage } from "./modules/master-data/MasterDataPage";
import { ContentPage } from "./modules/content/ContentPage";
import { SettingsPage } from "./modules/settings/SettingsPage";
import { PropertyTypesPage } from "./modules/properties/PropertyTypesPage";
import { AmenitiesPage } from "./modules/properties/AmenitiesPage";
import { AnimalsPage } from "./modules/properties/AnimalsPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route element={<RequireAuth><AdminLayout /></RequireAuth>}>
      <Route index element={<DashboardPage />} />
      <Route path="guests" element={<GuestsPage />} />
      <Route path="guests/:id" element={<GuestDetailPage />} />
      <Route path="hosts" element={<HostsPage />} />
      <Route path="hosts/:id" element={<HostDetailPage />} />
      <Route path="properties" element={<PropertiesPage />} />
      <Route path="properties/new" element={<PropertyFormPage />} />
      <Route path="properties/:id" element={<PropertyDetailPage />} />
      <Route path="properties/:id/edit" element={<PropertyFormPage />} />
      <Route path="property-types" element={<PropertyTypesPage />} />
      <Route path="property-amenities" element={<AmenitiesPage />} />
      <Route path="friendly-animals" element={<AnimalsPage />} />
      <Route path="bookings" element={<BookingsPage />} />
      <Route path="bookings/:id" element={<BookingDetailPage />} />
      <Route path="payments" element={<PaymentsPage />} />
      <Route path="reviews" element={<ReviewsPage />} />
      <Route path="reports" element={<SupportPage />} />
      <Route path="contact-us" element={<EnquiriesPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="master-data" element={<MasterDataPage />} />
      <Route path="cms/:slug" element={<ContentPage />} />
      <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
