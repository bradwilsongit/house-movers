/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Home from './pages/Home';
import CreateMove from './pages/CreateMove';
import MyMoves from './pages/MyMoves';
import BookingDetails from './pages/BookingDetails';
import SupplierOnboarding from './pages/SupplierOnboarding';
import SupplierDashboard from './pages/SupplierDashboard';
import SupplierJobs from './pages/SupplierJobs';
import AdminDashboard from './pages/AdminDashboard';
import AdminSuppliers from './pages/AdminSuppliers';
import AdminBookings from './pages/AdminBookings';
import AdminExtras from './pages/AdminExtras';
import AdminSupport from './pages/AdminSupport';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Support from './pages/Support';
import SupplierProfile from './pages/SupplierProfile';
import SupplierJobDetails from './pages/SupplierJobDetails';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "CreateMove": CreateMove,
    "MyMoves": MyMoves,
    "BookingDetails": BookingDetails,
    "SupplierOnboarding": SupplierOnboarding,
    "SupplierDashboard": SupplierDashboard,
    "SupplierJobs": SupplierJobs,
    "AdminDashboard": AdminDashboard,
    "AdminSuppliers": AdminSuppliers,
    "AdminBookings": AdminBookings,
    "AdminExtras": AdminExtras,
    "AdminSupport": AdminSupport,
    "Profile": Profile,
    "Settings": Settings,
    "Terms": Terms,
    "Privacy": Privacy,
    "Support": Support,
    "SupplierProfile": SupplierProfile,
    "SupplierJobDetails": SupplierJobDetails,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};