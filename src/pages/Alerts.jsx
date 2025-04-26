// -------------------------------
// ALERTS PAGE COMPONENT
// -------------------------------
// Features:
// 1. Real-time alert notifications
// 2. Historical alert browsing
// 3. Alert status management
// -------------------------------

import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { useNotification } from "../services/notificationService";
import Button from "../components/ui/button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { Bell, BellOff, AlertTriangle, Info } from "lucide-react";

const Alerts = () => {
  // -------------------------------
  // STATE MANAGEMENT
  // -------------------------------
  const [alerts, setAlerts] = useState([]);
  const [filters, setFilters] = useState({
    status: "all", // 'all' | 'unresolved' | 'resolved'
    severity: "all" // 'all' | 'high' | 'medium' | 'low'
  });
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  // -------------------------------
  // DATA FETCHING & REAL-TIME UPDATES
  // -------------------------------
  useEffect(() => {
    // Initial fetch
    const fetchAlerts = async () => {
      try {
        let query = supabase
          .from("alerts")
          .select(`
            id,
            created_at,
            title,
            message,
            severity,
            resolved,
            related_face:known_face_id(name),
            image_url
          `)
          .order("created_at", { ascending: false });

        // Apply filters
        if (filters.status !== "all") {
          query = query.eq("resolved", filters.status === "resolved");
        }
        if (filters.severity !== "all") {
          query = query.eq("severity", filters.severity);
        }

        const { data, error } = await query;
        if (error) throw error;
        setAlerts(data || []);

      } catch (error) {
        addNotification("Failed to load alerts", "error");
      } finally {
        setLoading(false);
      }
    };

    // Real-time subscriptions
    const alertsSubscription = supabase
      .channel("alerts-channel")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "alerts"
      }, fetchAlerts)
      .subscribe();

    fetchAlerts();

    return () => {
      alertsSubscription.unsubscribe();
    };
  }, [filters]);

  // -------------------------------
  // ALERT MANAGEMENT FUNCTIONS
  // -------------------------------
  const updateAlertStatus = async (alertId, resolved) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .update({ resolved })
        .eq("id", alertId);

      if (error) throw error;
      addNotification(`Alert marked as ${resolved ? "resolved" : "unresolved"}`, "success");

    } catch (error) {
      addNotification("Failed to update alert status", "error");
    }
  };

  // -------------------------------
  // SEVERITY INDICATOR COMPONENT
  // -------------------------------
  const SeverityIndicator = ({ severity }) => {
    const config = {
      high: { color: "bg-red-500", icon: <AlertTriangle size={18} /> },
      medium: { color: "bg-yellow-500", icon: <AlertTriangle size={18} /> },
      low: { color: "bg-blue-500", icon: <Info size={18} /> }
    };

    return (
      <div className={`${config[severity].color} w-8 h-8 rounded-lg flex items-center justify-center`}>
        {config[severity].icon}
      </div>
    );
  };

  // -------------------------------
  // RENDER LOGIC
  // -------------------------------
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Security Alerts</h1>

        {/* Filter Controls */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <select
            className="w-full p-3 bg-gray-700 rounded-lg"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">All Statuses</option>
            <option value="unresolved">Unresolved Only</option>
            <option value="resolved">Resolved Only</option>
          </select>

          <select
            className="w-full p-3 bg-gray-700 rounded-lg"
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
          >
            <option value="all">All Severities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-6 border-b border-gray-700 last:border-0 ${
                  alert.resolved ? "opacity-75" : "hover:bg-gray-750"
                } transition-all`}
              >
                <div className="flex items-start gap-6">
                  {/* Severity Indicator */}
                  <SeverityIndicator severity={alert.severity} />

                  {/* Alert Content */}
                  <div className="flex-grow">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-semibold text-lg">{alert.title}</h3>
                      {alert.resolved && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">
                          Resolved
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-400 mb-2">{alert.message}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>
                        {new Date(alert.created_at).toLocaleDateString()}
                      </span>
                      {alert.related_face && (
                        <span>Related to: {alert.related_face.name}</span>
                      )}
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="flex flex-col gap-2 min-w-[120px]">
                    <Button
                      size="sm"
                      variant={alert.resolved ? "secondary" : "primary"}
                      onClick={() => updateAlertStatus(alert.id, !alert.resolved)}
                    >
                      {alert.resolved ? "Mark Unresolved" : "Resolve Alert"}
                    </Button>
                    {alert.image_url && (
                      <img
                        src={alert.image_url}
                        alt="Alert capture"
                        className="w-16 h-16 rounded-lg object-cover mt-2"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <BellOff className="mx-auto h-12 w-12 mb-4" />
                No alerts found matching current filters
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;