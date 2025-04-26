const cameraService = {
  selectedCamera: localStorage.getItem("selectedCamera") || "",
  streaming: localStorage.getItem("streaming") === "true",

  setSelectedCamera(camera) {
    this.selectedCamera = camera;
    localStorage.setItem("selectedCamera", camera);
  },

  setStreaming(state) {
    this.streaming = state;
    localStorage.setItem("streaming", state);
  },
};

export default cameraService;
