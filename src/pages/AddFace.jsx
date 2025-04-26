import { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../services/notificationService";

const TOTAL_IMAGES = 5;
const CAPTURE_DELAY = 2000;
const COUNTDOWN_SECONDS = 3;
const API_BASE = "http://localhost:8000";

const angleInstructions = [
  "Look straight",
  "Look up",
  "Look down",
  "Look left",
  "Look right",
];

const AddFace = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  // State
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [webcamReady, setWebcamReady] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [boundingBox, setBoundingBox] = useState(null);

  // Detect face periodically
  useEffect(() => {
    let interval;
    if (webcamReady) {
      interval = setInterval(detectFace, 1000);
    }
    return () => clearInterval(interval);
  }, [webcamReady]);

  // Face detection logic
  const detectFace = async () => {
    if (!webcamRef.current) return;
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      const response = await fetch(`${API_BASE}/faces/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageSrc.split(",")[1] }),
      });
      if (!response.ok) {
        setFaceDetected(false);
        setBoundingBox(null);
        return;
      }
      const result = await response.json();
      setFaceDetected(result.face_detected);
      setBoundingBox(result.bbox || null);
    } catch (error) {
      console.error("Detection error:", error);
      setFaceDetected(false);
      setBoundingBox(null);
    }
  };

  // Draw bounding box
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    if (canvas && video) {
      // Force canvas to 640×640
      canvas.width = 640;
      canvas.height = 640;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (boundingBox) {
        const [x1, y1, x2, y2] = boundingBox;
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      }
    }
  }, [boundingBox]);

  // Countdown timer
  const runInitialCountdown = async (seconds) => {
    setCountdown(seconds);
    for (let i = seconds; i > 0; i--) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCountdown((prev) => prev - 1);
    }
    setCountdown(0);
  };

  // Start capture process
  const startCaptureProcess = async () => {
    if (!name.trim() || !userId.trim()) {
      addNotification("Both Name and User ID are required.", "error");
      return;
    }

    setCapturing(true);
    setCapturedImages([]);
    setCurrentAngle(0);

    try {
      await runInitialCountdown(COUNTDOWN_SECONDS);

      const images = [];
      for (let i = 0; i < TOTAL_IMAGES; i++) {
        setCurrentAngle(i);
        if (!faceDetected) {
          addNotification("Face lost during capture!", "error");
          throw new Error("Face not detected");
        }
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) throw new Error("Failed to capture image");
        images.push(imageSrc);

        await new Promise((resolve) => setTimeout(resolve, CAPTURE_DELAY));
      }
      setCapturedImages(images);
      setShowPopup(true);
    } catch (error) {
      console.error("Capture error:", error);
      addNotification(error.message, "error");
    } finally {
      setCapturing(false);
    }
  };

  // Upload logic
  const uploadEmbeddings = async () => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("user_id", userId);

      capturedImages.forEach((img, idx) => {
        const blob = dataURLtoBlob(img);
        formData.append("files", blob, `angle_${idx}.jpg`);
      });

      const response = await fetch(`${API_BASE}/faces/add-face`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }
      addNotification("Face added successfully!", "success");
    } catch (error) {
      console.error("Upload error:", error);
      addNotification(error.message || "Failed to add face.", "error");
    } finally {
      setShowPopup(false);
    }
  };

  // Confirm & Cancel
  const handleConfirm = () => {
    uploadEmbeddings();
    navigate("/manage-faces");
  };
  const handleCancel = () => {
    window.location.reload();
  };

  // Helper: dataURL to Blob
  const dataURLtoBlob = (dataURL) => {
    const byteString = atob(dataURL.split(",")[1]);
    const mimeString = dataURL.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  // Progress
  const progressPercent = Math.round(((currentAngle + 1) / TOTAL_IMAGES) * 100);

 return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Register New Face</h1>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form Inputs */}
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-gray-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                inputMode="numeric"
              />
            </div>

            {/* Camera Preview */}
            <div className="relative aspect-square bg-gray-900 rounded-xl overflow-hidden">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="absolute inset-0 w-full h-full object-cover"
                videoConstraints={{
                  facingMode: "user",
                  width: 640,
                  height: 640
                }}
                onUserMedia={() => setWebcamReady(true)}
                onUserMediaError={() => addNotification("Webcam access required", "error")}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                width="640"
                height="640"
              />
              
              {countdown > 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-6xl">
                  {countdown}
                </div>
              )}
            </div>
          </div>

          {/* Capture Controls */}
          <div className="mt-6 space-y-4">
            {!capturing ? (
              <button
                onClick={startCaptureProcess}
                disabled={!name || !userId || !faceDetected || !webcamReady}
                className="w-full bg-gray-900 hover:bg-blue-600 p-3 rounded-lg font-semibold disabled:opacity-50 transition-colors"
              >
                {!webcamReady 
                  ? "Initializing webcam..." 
                  : faceDetected 
                    ? "Start Capture Process" 
                    : "Position face in frame"}
              </button>
            ) : (
              <div className="text-center space-y-2">
                <div className="text-lg font-semibold">
                  Capturing Angle {currentAngle + 1} of {TOTAL_IMAGES}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((currentAngle + 1) / TOTAL_IMAGES) * 100}%` }}
                  />
                </div>
                <div className="text-sm text-gray-300">
                  {angleInstructions[currentAngle]}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Popup */}
        {showPopup && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl">
              <div className="flex flex-col md:flex-row">
                {/* Image Preview */}
                <div className="md:w-2/3 bg-gray-900 p-4 flex items-center justify-center">
                  {capturedImages[0] && (
                    <img
                      src={capturedImages[0]}
                      alt="Face Preview"
                      className="w-full h-64 md:h-96 object-contain rounded-lg"
                    />
                  )}
                </div>

                {/* Data Section */}
                <div className="md:w-1/3 p-6 flex flex-col">
                  <h2 className="text-2xl font-bold mb-6 text-center">Confirm Details</h2>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-sm font-medium text-gray-400 block mb-1">Name</label>
                      <div className="text-lg font-semibold bg-gray-700 p-3 rounded-lg">
                        {name}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-400 block mb-1">ID Number</label>
                      <div className="text-lg font-semibold bg-gray-700 p-3 rounded-lg">
                        {userId}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-auto space-y-3">
                    <button
                      onClick={uploadEmbeddings}
                      className="w-full bg-blue-600 hover:bg-gray-900 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Confirm Registration
                    </button>
                    <button
                      onClick={() => setShowPopup(false)}
                      className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Retake
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddFace;
