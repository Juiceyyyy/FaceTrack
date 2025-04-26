import { useEffect, useRef } from "react";

const WebcamStream = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchStream = async () => {
      videoRef.current.src = import.meta.env.VITE_BACKEND_URL + "/video_feed";
    };

    fetchStream();
  }, []);

  return (
    <div className="flex justify-center">
      <img ref={videoRef} alt="Live Feed" className="rounded-lg shadow-md w-full max-w-lg" />
    </div>
  );
};

export default WebcamStream;