// -------------------------------
// KNOWN FACES MANAGEMENT PAGE (REVISED)
// -------------------------------
import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { useNotification } from "../services/notificationService";
import Button from "../components/ui/button";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const KnownFaces = () => {
  // -------------------------------
  // STATE MANAGEMENT
  // -------------------------------
  const [faces, setFaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  // -------------------------------
  // DATA FETCHING
  // -------------------------------
  useEffect(() => {
    const fetchFaces = async () => {
      try {
        const { data, error } = await supabase
          .from("known_faces")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setFaces(data || []);
      } catch (error) {
        addNotification("Failed to load known faces", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchFaces();
  }, []);

  // -------------------------------
  // FACE DELETION HANDLER (IMPROVED)
  // -------------------------------
  const handleDelete = async (faceId, imageUrls) => {
    if (!window.confirm("Permanently delete this face record and all associated images?")) return;

    try {
      // Validate and extract storage paths
      const paths = imageUrls.map(url => {
        const parsedUrl = new URL(url);
        const pathParts = parsedUrl.pathname.split('/static/');
        if (pathParts.length < 2) throw new Error("Invalid image URL format");
        return pathParts[1];
      });

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("static")
        .remove(paths);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("known_faces")
        .delete()
        .eq("face_id", faceId);

      if (dbError) throw dbError;

      // Update UI state
      setFaces(prev => prev.filter(f => f.face_id !== faceId));
      addNotification("Face record and images deleted successfully", "success");
    } catch (error) {
      console.error("Deletion error:", error);
      addNotification(
        `Deletion failed: ${error.message || 'Check console for details'}`,
        "error"
      );
    }
  };

  // -------------------------------
  // SEARCH FILTERING
  // -------------------------------
  const filteredFaces = faces.filter(face => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      face.name.toLowerCase().includes(searchTerm) ||
      face.userId.toString().includes(searchTerm)
    );
  });

  // -------------------------------
  // RENDER LOGIC (UPDATED TO MATCH UI)
  // -------------------------------
  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 border-b border-gray-700 pb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Registered Faces</h1>
          <p className="text-gray-400">Manage known face profiles and associated data</p>
        </header>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search faces by name or ID..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="absolute right-3 top-3.5 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          /* Faces Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredFaces.map((face) => (
              <div
                key={face.face_id}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-blue-500 transition-colors"
              >
                {/* Image Carousel */}
                <div className="relative aspect-square mb-4 rounded-lg overflow-hidden bg-gray-700">
                  {face.image_url.length > 0 ? (
                    face.image_url.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`${face.name} - Angle ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No Images Available
                    </div>
                  )}
                </div>

                {/* Face Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg text-gray-200 text-m font-semibold">{face.name}</h3>
                    <span className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full text-sm">
                      ID: {face.userId}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(face.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="danger"
                    className="w-full mt-2"
                    onClick={() => handleDelete(face.face_id, face.image_url)}
                  >
                    Delete Profile
                  </Button>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {filteredFaces.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="inline-block bg-gray-800 p-6 rounded-xl">
                  <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-4 text-white font-medium">
                    {faces.length === 0 ? 'No registered faces' : 'No matches found'}
                  </h3>
                  <p className="mt-1 text-gray-400 text-sm">
                    {faces.length === 0 ? 'Add new faces using the registration system' : 'Try adjusting your search terms'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnownFaces;