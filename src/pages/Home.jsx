// -------------------------------
// HOME PAGE - MAIN DASHBOARD
// -------------------------------
// Features:
// 1. System overview
// 2. Quick access cards
// 3. Recent activity feed
// -------------------------------

import { useEffect, useState } from "react";
import Card from "../components/ui/card";
import { Activity, Users, Camera, AlertCircle } from "lucide-react";
import { supabase } from "../services/supabase";
import { BsQuestionCircle, BsFileText } from "react-icons/bs";

// Calculate boundaries in UTC
const today = new Date();
today.setUTCHours(0, 0, 0, 0); // Start of today in UTC

const tomorrow = new Date(today);
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1); // Start of tomorrow in UTC

const Home = () => {
  const [stats, setStats] = useState({
    totalFaces: 0,
    activeCameras: 0,
    recentAlerts: 0
  });

  // -------------------------------
  // FETCH SYSTEM STATISTICS
  // -------------------------------
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: faces } = await supabase
          .from("known_faces")
          .select("*", { count: "exact" });

        const { count: cameras } = await supabase
          .from("unknown_faces")
          .select("*", { count: "exact" });

        const { count: alerts, error } = await supabase
          .from("detection_logs")
          .select("*", { count: "exact" })
          .gte("timestamp", today.toISOString())
          .lt("timestamp", tomorrow.toISOString());

        setStats({
          totalFaces: faces || 0,
          activeCameras: cameras || 0,
          recentAlerts: alerts || 0
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">System Overview</h1>

        {/* Quick Stats Grid */}
        <div className="grid bg-gray-900 grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard 
            icon={<Users className="h-6 w-6" />}
            title="Registered Faces"
            value={stats.totalFaces}
            color="bg-blue-600"
          />
          <StatCard
            icon={<BsQuestionCircle className="h-6 w-6" />}
            title="Unknown Faces"
            value={stats.activeCameras}
            color="bg-blue-600"
          />
          <StatCard
            icon={<Camera className="h-6 w-6" />}
            title="Detections Today"
            value={stats.recentAlerts}
            color="bg-blue-600"
          />
        </div>

        {/* Quick Access Section */}
        <div className="bg-gray-700 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-6 text-gray-50">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              title="Real-Time Monitoring"
              description="View live camera feeds"
              icon={Camera}
              to="/track"
              className="hover:bg-gray-900"
            />
            <Card
              title="Manage Faces"
              description="Add/remove known faces"
              icon={Users}
              to="/manage-faces"
              className="hover:bg-gray-900"
            />
            <Card
              title="Detection Logs"
              description="View recorded detections"
              icon={BsFileText}
              to="/logs"
              className="hover:bg-gray-900"
            />
            <Card
              title="Alerts"
              description="View system alerts"
              icon={AlertCircle}
              to="/alerts"
              className="hover:bg-gray-900"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------
// STAT CARD COMPONENT
// -------------------------------
const StatCard = ({ icon, title, value, color }) => (
  <div className={`${color} p-6 rounded-xl flex items-center gap-4`}>
    <div className="p-3 bg-white/10 rounded-lg">{icon}</div>
    <div>
      <p className="text-sm text-white/80">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

export default Home;