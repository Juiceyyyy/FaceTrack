// -------------------------------
// API SERVICE - BACKEND COMMUNICATION
// -------------------------------
// Features:
// 1. Centralized API calls
// 2. Error handling
// 3. Request/response formatting
// -------------------------------

const API_BASE = import.meta.env.VITE_BACKEND_URL;

// -------------------------------
// FACE OPERATIONS
// -------------------------------

/**
 * Register new face with multiple angles
 * @param {Object} data - { name, userId, files: File[] }
 */
export const registerFace = async (data) => {
  try {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("userId", data.userId);
    data.files.forEach((file, index) => {
      formData.append(`files`, file, `angle_${index}.jpg`);
    });

    const response = await fetch(`${API_BASE}/faces/register`, {
      method: "POST",
      body: formData
    });

    return handleResponse(response);
  } catch (error) {
    throw new Error(`Registration failed: ${error.message}`);
  }
};

/**
 * Recognize face from image
 * @param {File} imageFile - Image file to analyze
 */
export const recognizeFace = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append("file", imageFile);

    const response = await fetch(`${API_BASE}/faces/recognize`, {
      method: "POST",
      body: formData
    });

    return handleResponse(response);
  } catch (error) {
    throw new Error(`Recognition failed: ${error.message}`);
  }
};

// -------------------------------
// CAMERA OPERATIONS
// -------------------------------

/**
 * Get list of available cameras
 */
export const getCameras = async () => {
  try {
    const response = await fetch(`${API_BASE}/camera/cameras`);
    return handleResponse(response);
  } catch (error) {
    throw new Error("Failed to fetch cameras");
  }
};

/**
 * Start camera stream
 * @param {number} cameraId - Camera device ID
 */
export const startCameraStream = async (cameraId) => {
  try {
    const response = await fetch(`${API_BASE}/camera/select/${cameraId}`, {
      method: "POST"
    });
    return handleResponse(response);
  } catch (error) {
    throw new Error("Camera activation failed");
  }
};

// -------------------------------
// HELPER FUNCTIONS
// -------------------------------

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Request failed");
  }
  return response.json();
};