import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [knownUnknownFilter, setKnownUnknownFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get today's date in ISO format (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("detection_logs")
        .select(`
          log_id,
          timestamp,
          confidence,
          image_url,
          known_face_id (
            face_id,
            userId,
            name
          ),
          unknown_face_id (
            face_id,
            name
          )
        `)
        .order("timestamp", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter pipelines
  const knownUnknownFiltered = logs.filter((log) => {
    if (knownUnknownFilter === "all") return true;
    return knownUnknownFilter === "known" ? !!log.known_face_id : !!log.unknown_face_id;
  });

  const searchFiltered = knownUnknownFiltered.filter((log) => {
    if (!searchTerm) return true;
    const name = log.known_face_id?.name || log.unknown_face_id?.name || "Unknown";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const dateFiltered = searchFiltered.filter(log => {
    if (!selectedDate) return true; // Show all if no date selected
    const logDate = new Date(log.timestamp).toLocaleDateString('en-CA');
    return logDate === selectedDate;
  });

  // Date formatting helper
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', '');
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b border-gray-700 pb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Recognition Logs</h1>
          <p className="text-gray-400">Historical detection records and system activity</p>
        </header>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search faces..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute right-3 top-3.5 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="flex gap-4 sm:w-96">
            <select
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 flex-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={knownUnknownFilter}
              onChange={(e) => setKnownUnknownFilter(e.target.value)}
            >
              <option value="all">All Faces</option>
              <option value="known">Known Only</option>
              <option value="unknown">Unknown Only</option>
            </select>

            <div className="flex-1 relative">
              <input
                type="date"
                className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={selectedDate || ''}
                onChange={(e) => setSelectedDate(e.target.value || null)}
                max={today}
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}

        {/* Logs Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {dateFiltered.map((log) => {
              const isKnown = !!log.known_face_id; 
              const faceName = log.known_face_id?.name || log.unknown_face_id?.name || "Unknown";
              const userId = log.known_face_id?.userId;
              const confidence = (log.confidence * 100)?.toFixed(2); 

              return (
                <div
                  key={log.log_id}
                  className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-blue-500 transition-colors"
                >
                  <div className="flex gap-4">
                    <img
                      src={log.image_url}
                      alt={faceName}
                      className="w-20 h-20 object-cover rounded-lg border-2 border-gray-700"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${isKnown ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                          {isKnown ? 'Known' : 'Unknown'}
                        </span>
                        {userId && (
                          <span className="bg-blue-900/50 text-blue-400 px-2 py-1 rounded-full text-sm">
                            ID: {userId}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-white font-semibold mb-2">{faceName}</h3>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDateTime(log.timestamp)}
                      </div>

                      {/* Confidence Meter */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Confidence:</span>
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div
                            className={`${isKnown ? 'bg-green-500' : 'bg-red-500'} h-2 rounded-full`}
                            style={{ width: `${confidence}%` }}
                          />
                        </div>
                        <span className={`font-medium ${isKnown ? 'text-green-400' : 'text-red-400'}`}>
                          {confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No Results State */}
        {!loading && dateFiltered.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-block bg-gray-800 p-6 rounded-xl">
              <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-white font-medium">No matching logs found</h3>
              <p className="mt-1 text-gray-400 text-sm">Try adjusting your search or filters</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;