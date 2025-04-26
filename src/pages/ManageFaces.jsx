// -------------------------------
// FACE MANAGEMENT HUB
// -------------------------------
// Features:
// 1. Navigation hub for face operations
// 2. Quick access to key functions
// -------------------------------

import { Link } from "react-router-dom";
import Card from "../components/ui/card";
import { PlusCircle, Users, AlertTriangle } from "lucide-react";

const ManageFaces = () => {
  // -------------------------------
  // MANAGEMENT OPTIONS
  // -------------------------------
  const managementOptions = [
    {
      title: "Add New Face",
      description: "Register new individuals to the system",
      icon: PlusCircle,
      path: "/add-face",
      color: "bg-gray-700"
    },
    {
      title: "Known Faces",
      description: "Manage recognized individuals",
      icon: Users,
      path: "/known-faces",
      color: "bg-gray-700"
    },
    {
      title: "Unknown Faces",
      description: "Review unidentified detections",
      icon: AlertTriangle,
      path: "/unknown-faces",
      color: "bg-gray-700"
    }
  ];

  // -------------------------------
  // RENDER LOGIC
  // -------------------------------
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Face Management Center</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {managementOptions.map((option, index) => (
            <Link 
              key={index}
              to={option.path}
              className="transform transition-all hover:scale-105"
            >
              <Card
                title={option.title}
                description={option.description}
                icon={option.icon}
                className={`${option.color} hover:bg-opacity-90`}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageFaces;