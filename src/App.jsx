import { Suspense, lazy, useState, useEffect } from "react";
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from "react-router-dom";
import { supabase } from "./services/supabase";
import Navbar from "./components/Navbar";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingFallback from "./components/ui/LoadingFallback";

// Lazy-loaded page components
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Track = lazy(() => import("./pages/Track"));
const ManageFaces = lazy(() => import("./pages/ManageFaces"));
const KnownFaces = lazy(() => import("./pages/KnownFaces"));
const UnknownFaces = lazy(() => import("./pages/UnknownFaces"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Logs = lazy(() => import("./pages/Logs"));
const AddFace = lazy(() => import("./pages/AddFace"));

const App = () => {
  const [authState, setAuthState] = useState({
    user: null,
    loading: true
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState({
          user: session?.user ?? null,
          loading: false
        });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        {!authState.loading && authState.user && <Navbar />}
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {authState.user ? (
              // Authenticated routes
              <>
                <Route path="/" element={<Home />} />
                <Route path="/track" element={<Track />} />
                <Route path="/manage-faces" element={<ManageFaces />} />
                <Route path="/known-faces" element={<KnownFaces />} />
                <Route path="/unknown-faces" element={<UnknownFaces />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/logs" element={<Logs />} />
                <Route path="/add-face" element={<AddFace />} />
                
                {/* Catch-all redirect for authenticated users */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              // Redirect unauthenticated users to login
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
};

export default App;