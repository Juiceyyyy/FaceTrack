import { Link, useNavigate } from "react-router-dom";
import { Bell, LogOut, Camera } from "lucide-react";
import { supabase } from "../services/supabase";
import logo from "../components/ui/logo.png";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between shadow-xl">
      {/* Left Section - Branding */}
      <div className="flex items-center space-x-4">
        <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
        <Link 
          to="/" 
          className="text-2xl font-bold hover:text-blue-400 transition-colors"
        >
          FaceTrack
        </Link>
      </div>


      {/* Right Section - Navigation */}
      <div className="flex items-center space-x-6">
        <Link
          to="/alerts"
          className="flex items-center space-x-2 hover:text-blue-400 transition-colors"
        >
          <Bell className="h-6 w-6" />
          <span className="hidden md:inline">Alerts</span>
        </Link>
        
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-6 w-6" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;