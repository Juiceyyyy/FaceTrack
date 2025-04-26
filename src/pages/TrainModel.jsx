import { useState } from "react";

const TrainModel = () => {
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const trainModel = async () => {
    setLoading(true);
    setTrainingStatus(null);

    try {
      const response = await fetch("http://localhost:8000/train", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      setTrainingStatus({
        success: true,
        message: `Training started! Check logs for progress.`,
      });

      console.log("Training Response:", data);
    } catch (error) {
      console.error("Error starting training:", error);
      setTrainingStatus({
        success: false,
        message: "Failed to start training. Please check the server.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <h2 className="text-2xl font-bold mb-4">Train Model</h2>
      <button
        onClick={trainModel}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition"
        disabled={loading}
      >
        {loading ? "Starting Training..." : "Train Face Recognition Model"}
      </button>

      {trainingStatus && (
        <div
          className={`mt-4 p-3 w-full max-w-md text-center rounded-lg ${
            trainingStatus.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {trainingStatus.message}
        </div>
      )}
    </div>
  );
};

export default TrainModel;
