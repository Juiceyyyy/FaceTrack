// -------------------------------
// FACE RECOGNITION SERVICE
// -------------------------------
// Features:
// 1. Face detection API calls
// 2. Face comparison utilities
// -------------------------------

const API_BASE = import.meta.env.VITE_BACKEND_URL;

/**
 * Detect faces in image
 * @param {File} imageFile - Image file to analyze
 */
export const detectFaces = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append("file", imageFile);

    const response = await fetch(`${API_BASE}/faces/detect`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("Detection failed");
    return response.json();
  } catch (error) {
    console.error("Face detection error:", error);
    return { faces: [] };
  }
};

/**
 * Compare face embeddings
 * @param {Array} embedding1 - First face embedding
 * @param {Array} embedding2 - Second face embedding
 */
export const compareEmbeddings = (embedding1, embedding2) => {
  // Cosine similarity implementation
  const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
  const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val ** 2, 0));
  const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val ** 2, 0));
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  return dotProduct / (magnitude1 * magnitude2);
};