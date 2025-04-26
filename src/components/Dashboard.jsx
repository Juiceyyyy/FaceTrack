import React from "react";
import { Link } from "react-router-dom";
import { Camera, PlusCircle, List, Bell, Users } from "lucide-react";

const Dashboard = () => {
  const features = [
    {
      title: "Live Tracking",
      description: "Real-time face detection and monitoring",
      icon: Camera,
      path: "/track",
      color: "bg-blue-500"
    },
    {
      title: "Add New Face",
      description: "Register new faces to the system",
      icon: PlusCircle,
      path: "/add-face",
      color: "bg-green-500"
    },
    {
      title: "Known Faces",
      description: "Manage recognized individuals",
      icon: Users,
      path: "/known-faces",
      color: "bg-purple-500"
    },
    {
      title: "Detection Logs",
      description: "View historical recognition data",
      icon: List,
      path: "/logs",
      color: "bg-yellow-500"
    },
    {
      title: "Security Alerts",
      description: "Review system notifications",
      icon: Bell,
      path: "/alerts",
      color: "bg-red-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Face Recognition Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Central management for facial recognition operations
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.path}
              className="group transform transition-all duration-300 hover:scale-105"
            >
              <div className={`${feature.color} p-6 rounded-xl shadow-lg h-full`}>
                <div className="flex items-center space-x-4">
                  <feature.icon className="h-12 w-12 text-white" />
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-gray-200 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;