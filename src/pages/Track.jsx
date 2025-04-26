// -------------------------------
// TRACK PAGE - REAL-TIME MONITORING
// -------------------------------
// Features:
// 1. Camera selection
// 2. Live video feed display
// 3. Detection controls
// -------------------------------

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/button";
import cameraService from "../services/cameraService";

const Track = () => {
  const [selectedCamera, setSelectedCamera] = useState(cameraService.selectedCamera);
  const [cameras, setCameras] = useState([]);
  const [streaming, setStreaming] = useState(cameraService.streaming);
  const [videoUrl, setVideoUrl] = useState(
    streaming ? `${import.meta.env.VITE_BACKEND_URL}/camera/stream` : ""
  );
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchCameras() }, []);

  const fetchCameras = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/camera/cameras`);
      const data = await response.json();
      setCameras(Array.isArray(data.available_cameras) ? data.available_cameras : []);
    } catch (error) {
      console.error("Error fetching cameras:", error);
    }
  };

  const startDetection = async () => {
    if (!selectedCamera) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/camera/select_camera/${selectedCamera}`,
        { method: "POST" }
      );
      if (response.ok) {
        cameraService.setStreaming(true);
        setStreaming(true);
        setVideoUrl(`${import.meta.env.VITE_BACKEND_URL}/camera/stream`);
      }
    } catch (error) {
      console.error("Error starting detection:", error);
    }
  };

  const stopDetection = async () => {
    try {
      setVideoUrl("");
      cameraService.setStreaming(false);
      setStreaming(false);
      setShowPopup(true);
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/camera/stop`, { method: "POST" });
    } catch (error) {
      console.error("Error stopping detection:", error);
    }
  };

  const handlePopupConfirm = async () => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/camera/stop`, { method: "POST" });
      cameraService.setSelectedCamera("");
      setSelectedCamera("");
      setStreaming(false);
      setShowPopup(false);
      navigate("/");
    } catch (error) {
      console.error("Error stopping camera:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Real-Time Monitoring</h1>

        <div className="bg-gray-700 p-6 rounded-xl shadow-lg">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Camera Source</label>
              <select
                className="w-full bg-gray-800 p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
                value={selectedCamera || ""}
                onChange={(e) => {
                  cameraService.setSelectedCamera(e.target.value);
                  setSelectedCamera(e.target.value);
                }}
              >
                <option value="">Select camera</option>
                {cameras.map((cam, index) => (
                  <option key={index} value={cam}>
                    Camera {index + 1} - {cam}
                  </option>
                ))}
              </select>
            </div>

            <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden">
              {selectedCamera ? (
                streaming ? (
                  <img
                    src={videoUrl}
                    alt="Live Feed"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Camera ready - Start detection to begin streaming
                  </div>
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No camera selected
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3"
                onClick={startDetection}
                disabled={streaming || !selectedCamera}
              >
                Start Detection
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 px-6 py-3"
                onClick={stopDetection}
                disabled={!streaming}
              >
                Stop Detection
              </Button>
            </div>
          </div>
        </div>

        {showPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-xl text-center max-w-md">
              <h3 className="text-xl font-bold mb-4">Detection Stopped</h3>
              <div className="flex gap-4 justify-center">
                <Button
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2"
                  onClick={() => setShowPopup(false)}
                >
                  Continue Tracking
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2"
                  onClick={handlePopupConfirm}
                >
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Track;