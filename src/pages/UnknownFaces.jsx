// -------------------------------
// UNKNOWN FACES INTERFACE (Revised)
// -------------------------------
import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { useNotification } from "../services/notificationService";
import Button from "../components/ui/button";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const UnknownFaces = () => {
  // -------------------------------
  // STATE MANAGEMENT
  // -------------------------------
  const [unknownFaces, setUnknownFaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  // -------------------------------
  // DATA FETCHING
  // -------------------------------
  useEffect(() => {
    const fetchUnknownFaces = async () => {
      try {
        const { data, error } = await supabase
          .from("unknown_faces")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setUnknownFaces(data || []);
      } catch (error) {
        addNotification("Failed to load unknown faces", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchUnknownFaces();
  }, []);

  // -------------------------------
  // FACE MANAGEMENT HANDLERS
  // -------------------------------
  const deleteFace = async (faceId, imageUrl) => {
    if (!window.confirm("Permanently delete this face record?")) return;
  
    try {
      // Extract proper storage path from URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/static/');
      if (pathParts.length < 2) throw new Error("Invalid image URL format");
      
      const filePath = pathParts[1];
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('static')
        .remove([filePath]);
  
      if (storageError) throw storageError;
  
      // Delete from database
      const { error: dbError } = await supabase
        .from('unknown_faces')
        .delete()
        .eq('face_id', faceId);
  
      if (dbError) throw dbError;
  
      // Update UI state
      setUnknownFaces(prev => prev.filter(f => f.face_id !== faceId));
      addNotification('Face record and image deleted successfully', 'success');
    } catch (error) {
      console.error('Deletion error:', error);
      addNotification(
        `Deletion failed: ${error.message || 'Check console for details'}`,
        'error'
      );
    }
  };

  // -------------------------------
  // RENDER LOGIC
  // -------------------------------
  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 border-b border-gray-700 pb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Unknown Faces</h1>
          <p className="text-gray-400">Unidentified face detections and management</p>
        </header>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          /* Face Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {unknownFaces.map((face) => {
              const confidence = (face.confidence * 100).toFixed(1);
              const timestamp = new Date(face.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={face.face_id}
                  className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-blue-500 transition-colors"
                >
                  <div className="flex gap-4">
                    <img
                      src={face.image_url}
                      alt="Unknown face detection"
                      className="w-20 h-20 object-cover rounded-lg border-2 border-gray-700"
                    />
                    <div className="flex-1 space-y-3">
                      {/* Timestamp */}
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{timestamp}</span>
                      </div>

                      {/* Confidence Meter */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400">Confidence:</span>
                          <div className="flex-1 bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${confidence}%` }}
                            />
                          </div>
                          <span className="text-red-400 font-medium">
                            {confidence}%
                          </span>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <Button
                        variant="danger"
                        className="w-full mt-2"
                        onClick={() => deleteFace(face.face_id, face.image_url)}
                      >
                        Delete Permanently
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Empty State */}
            {unknownFaces.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="inline-block bg-gray-800 p-6 rounded-xl">
                  <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-4 text-white font-medium">No unknown faces detected</h3>
                  <p className="mt-1 text-gray-400 text-sm">All unrecognized faces will appear here</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnknownFaces;