import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import AppLayout from './components/AppLayout';
import FloatingBetSlip from './components/FloatingBetSlip';

// Auth
import Splash from './pages/auth/Splash';
import Welcome from './pages/auth/Welcome';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';

// Main
import Home from './pages/main/Home';
import Sports from './pages/main/Sports';
import Virtual from './pages/main/Virtual';
import VirtualBetHistory from './pages/main/VirtualBetHistory';
import VirtualTicketDetails from './pages/main/VirtualTicketDetails';
import AdminVirtual from './pages/admin/AdminVirtual';
import Competition from './pages/main/Competition';
import MatchDetail from './pages/main/MatchDetail';
import Search from './pages/main/Search';
import MyBets from './pages/main/MyBets';
import BetDetails from './pages/main/BetDetails';
import BetConfirmation from './pages/main/BetConfirmation';
import Promotions from './pages/main/Promotions';
import Notifications from './pages/main/Notifications';

// Wallet / Deposit / Withdraw
import DepositMethod from './pages/wallet/DepositMethod';
import DepositAmount from './pages/wallet/DepositAmount';
import DepositPayment from './pages/wallet/DepositPayment';
import DepositPending from './pages/wallet/DepositPending';
import Withdraw from './pages/wallet/Withdraw';
import WithdrawAmount from './pages/wallet/WithdrawAmount';
import WithdrawPayment from './pages/wallet/WithdrawPayment';
import WithdrawalSuccess from './pages/wallet/WithdrawalSuccess';
import TransactionHistory from './pages/wallet/TransactionHistory';

// Profile
import Profile from './pages/profile/Profile';
import PersonalInformation from './pages/profile/PersonalInformation';
import Security from './pages/profile/Security';
import BankAccounts from './pages/profile/BankAccounts';
import ResponsibleBetting from './pages/profile/ResponsibleBetting';
import HelpSupport from './pages/profile/HelpSupport';
import LegalPage from './pages/profile/LegalPage';
import Settings from './pages/profile/Settings';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const AUTH_ONLY_PATHS = ['/', '/welcome', '/login', '/signup', '/forgot-password'];
const NO_FLOATING_SLIP_PATHS = [...AUTH_ONLY_PATHS, '/virtual', '/admin'];

function AppRoutes() {
  const location = useLocation();
  const hideFloatingSlip = NO_FLOATING_SLIP_PATHS.includes(location.pathname);

  return (
    <>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<Splash />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* App shell (4-tab bottom nav) — guest-browsable, login only required for specific actions */}
        <Route element={<AppLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/sports" element={<Sports />} />
          <Route path="/virtual" element={<Virtual />} />
          <Route path="/my-bets" element={<MyBets />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/promotions" element={<Promotions />} />
        </Route>

        {/* Guest-browsable, full-screen (own header/back nav) */}
        <Route path="/competition/:id" element={<Competition />} />
        <Route path="/match/:id" element={<MatchDetail />} />
        <Route path="/search" element={<Search />} />

        {/* Virtual Football bet history — full-screen with its own back nav */}
        <Route path="/virtual/history" element={<RequireAuth><VirtualBetHistory /></RequireAuth>} />
        <Route path="/virtual/history/:id" element={<RequireAuth><VirtualTicketDetails /></RequireAuth>} />

        {/* Virtual Football admin — no login wall, per current scope */}
        <Route path="/admin" element={<AdminVirtual />} />

        {/* Requires login */}
        <Route path="/bet-details/:id" element={<RequireAuth><BetDetails /></RequireAuth>} />
        <Route path="/bet-confirmation" element={<RequireAuth><BetConfirmation /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />

        {/* Deposit flow: method -> amount -> payment (address/QR) -> pending */}
        <Route path="/deposit" element={<RequireAuth><DepositMethod /></RequireAuth>} />
        <Route path="/deposit/:method/amount" element={<RequireAuth><DepositAmount /></RequireAuth>} />
        <Route path="/deposit/:method/payment" element={<RequireAuth><DepositPayment /></RequireAuth>} />
        <Route path="/deposit/pending" element={<RequireAuth><DepositPending /></RequireAuth>} />

        {/* Withdraw flow */}
        <Route path="/withdraw" element={<RequireAuth><Withdraw /></RequireAuth>} />
        <Route path="/withdraw/:method/amount" element={<RequireAuth><WithdrawAmount /></RequireAuth>} />
        <Route path="/withdraw/:method/payment" element={<RequireAuth><WithdrawPayment /></RequireAuth>} />
        <Route path="/withdrawal-success" element={<RequireAuth><WithdrawalSuccess /></RequireAuth>} />

        {/* Profile sub-pages */}
        <Route path="/profile/personal-information" element={<RequireAuth><PersonalInformation /></RequireAuth>} />
        <Route path="/profile/security" element={<RequireAuth><Security /></RequireAuth>} />
        <Route path="/profile/bank-accounts" element={<RequireAuth><BankAccounts /></RequireAuth>} />
        <Route path="/profile/transactions" element={<RequireAuth><TransactionHistory /></RequireAuth>} />
        <Route path="/responsible-betting" element={<RequireAuth><ResponsibleBetting /></RequireAuth>} />
        <Route path="/help-support" element={<RequireAuth><HelpSupport /></RequireAuth>} />
        <Route path="/terms" element={<RequireAuth><LegalPage /></RequireAuth>} />
        <Route path="/privacy" element={<RequireAuth><LegalPage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideFloatingSlip && <FloatingBetSlip />}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
