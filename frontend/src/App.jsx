import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  Heart, Bell, Search, User, Home, Plus, BarChart3, MessageCircle,
  Users, ShieldCheck, FileCheck, LayoutDashboard, CreditCard,
  HelpCircle, Upload, ClipboardList, HeadphonesIcon,
} from 'lucide-react';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// ── Public Pages ──────────────────────────────────────────────────────────────
import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import Listings from './pages/public/Listings';
import PropertyDetails from './pages/public/PropertyDetails';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import ForgotPassword from './pages/public/ForgotPassword';   // FR06
import FAQ from './pages/public/FAQ';                          // FR50

// ── Student Pages ─────────────────────────────────────────────────────────────
import Favorites from './pages/student/Favorites';             // FR13
import Notifications from './pages/student/Notifications';     // FR46
import SavedSearches from './pages/student/SavedSearches';     // FR20
import Profile from './pages/student/Profile';
import PaymentHistory from './pages/student/PaymentHistory';   // FR44
import SupportTicket from './pages/student/SupportTicket';     // FR45

// ── Broker Pages ──────────────────────────────────────────────────────────────
import MyListings from './pages/broker/MyListings';
import AddListing from './pages/broker/AddListing';
import EditListing from './pages/broker/EditListing';
import BrokerAnalytics from './pages/broker/BrokerAnalytics';  // FR24, FR25
import Messages from './pages/broker/Messages';                // FR25
import IdentityVerification from './pages/broker/IdentityVerification'; // FR27, FR49

// ── Admin Pages ───────────────────────────────────────────────────────────────
import AdminUsers from './pages/admin/AdminUsers';
import BrokerVerification from './pages/admin/BrokerVerification'; // FR28
import AdminListings from './pages/admin/AdminListings';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AuditLogs from './pages/admin/AuditLogs';               // FR37

// ── Sidebar link configs ──────────────────────────────────────────────────────
const studentLinks = [
  { name: 'Favorites',       path: '/student',                  icon: Heart,          end: true },
  { name: 'Notifications',   path: '/student/notifications',    icon: Bell },
  { name: 'Saved Searches',  path: '/student/saved-searches',   icon: Search },
  { name: 'Payment History', path: '/student/payment-history',  icon: CreditCard },   // FR44
  { name: 'Support',         path: '/student/support',          icon: HeadphonesIcon }, // FR45
  { name: 'Profile',         path: '/student/profile',          icon: User },
];

const brokerLinks = [
  { name: 'My Listings',   path: '/broker',                  icon: Home,     end: true },
  { name: 'Add Listing',   path: '/broker/add-listing',      icon: Plus },
  { name: 'Analytics',     path: '/broker/analytics',        icon: BarChart3 },
  { name: 'Messages',      path: '/broker/messages',         icon: MessageCircle },
  { name: 'Verification',  path: '/broker/identity',         icon: ShieldCheck },   // FR27, FR49
  { name: 'Profile',       path: '/broker/profile',          icon: User },
];

const adminLinks = [
  { name: 'Analytics',         path: '/admin',                    icon: LayoutDashboard, end: true },
  { name: 'Users',             path: '/admin/users',              icon: Users },
  { name: 'Broker Verification', path: '/admin/broker-verification', icon: ShieldCheck },
  { name: 'Listings',          path: '/admin/listings',           icon: FileCheck },
  { name: 'Audit Logs',        path: '/admin/audit-logs',         icon: ClipboardList }, // FR37
];

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Public Routes ─────────────────────────────────────────────── */}
        <Route element={<MainLayout />}>
          <Route path="/"           element={<Landing />} />
          <Route path="/login"      element={<Login />} />
          <Route path="/register"   element={<Register />} />
          <Route path="/listings"   element={<Listings />} />
          <Route path="/listings/:id" element={<PropertyDetails />} />
          <Route path="/about"      element={<About />} />
          <Route path="/contact"    element={<Contact />} />
          <Route path="/faq"        element={<FAQ />} />              {/* FR50 */}
          <Route path="/forgot-password" element={<ForgotPassword />} /> {/* FR06 */}
        </Route>

        {/* ── Student Dashboard ─────────────────────────────────────────── */}
        <Route element={<DashboardLayout links={studentLinks} allowedRoles={['student', 'parent']} />}>
          <Route path="/student"                   element={<Favorites />} />       {/* FR13 */}
          <Route path="/student/notifications"     element={<Notifications />} />   {/* FR46 */}
          <Route path="/student/saved-searches"    element={<SavedSearches />} />   {/* FR20 */}
          <Route path="/student/payment-history"   element={<PaymentHistory />} />  {/* FR44 */}
          <Route path="/student/support"           element={<SupportTicket />} />   {/* FR45 */}
          <Route path="/student/profile"           element={<Profile />} />
        </Route>

        {/* ── Broker Dashboard ──────────────────────────────────────────── */}
        <Route element={<DashboardLayout links={brokerLinks} allowedRoles={['broker']} />}>
          <Route path="/broker"                    element={<MyListings />} />
          <Route path="/broker/add-listing"        element={<AddListing />} />
          <Route path="/broker/edit-listing/:id"   element={<EditListing />} />
          <Route path="/broker/analytics"          element={<BrokerAnalytics />} /> {/* FR24, FR25 */}
          <Route path="/broker/messages"           element={<Messages />} />         {/* FR25 */}
          <Route path="/broker/identity"           element={<IdentityVerification />} /> {/* FR27, FR49 */}
          <Route path="/broker/profile"            element={<Profile />} />
        </Route>

        {/* ── Admin Dashboard ───────────────────────────────────────────── */}
        <Route element={<DashboardLayout links={adminLinks} allowedRoles={['admin']} />}>
          <Route path="/admin"                         element={<AdminAnalytics />} />
          <Route path="/admin/users"                   element={<AdminUsers />} />
          <Route path="/admin/broker-verification"     element={<BrokerVerification />} /> {/* FR28 */}
          <Route path="/admin/listings"                element={<AdminListings />} />
          <Route path="/admin/audit-logs"              element={<AuditLogs />} />            {/* FR37 */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
