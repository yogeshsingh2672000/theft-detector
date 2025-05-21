import { useEffect, useState } from "react";
import useCamera from "../hooks/useCamera";
import { calculateDataUrlSize } from "../utils/imageUtils";

interface CameraProps {
  onCapture?: (dataUrl: string) => void;
  autoCapture?: boolean;
  captureInterval?: number;
  className?: string;
}

const Camera = ({
  onCapture,
  captureInterval = 5000,
  className = "",
}: CameraProps) => {
  const [imageSize, setImageSize] = useState<number>(0);

  const {
    videoRef,
    devices,
    selectedDevice,
    selectDevice,
    isLoading,
    error,
    lastCapture,
    captureImage,
  } = useCamera({
    enabled: true,
    captureInterval,
    facingMode: "environment", // Use the back camera by default
  });

  // Call onCapture callback when we have a new image
  useEffect(() => {
    if (lastCapture && onCapture) {
      const size = calculateDataUrlSize(lastCapture.dataUrl);
      setImageSize(size);
      onCapture(lastCapture.dataUrl);
    }
  }, [lastCapture, onCapture]);

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
          <div className="loading text-white">Loading camera...</div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
          <div className="error-message text-red-500 p-4 text-center">
            {error}
            <button
              onClick={() => window.location.reload()}
              className="block mx-auto mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="relative w-full">
        <video
          ref={videoRef}
          className="w-full h-full object-cover rounded-lg"
          autoPlay
          playsInline
          muted
        />

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black bg-opacity-50 rounded-lg p-2">
          {/* Camera selection */}
          {devices.length > 1 && (
            <select
              value={selectedDevice || ""}
              onChange={(e) => selectDevice(e.target.value)}
              className="bg-gray-800 text-white text-sm py-1 px-2 rounded mr-2"
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label ||
                    `Camera ${device.deviceId.substring(0, 5)}...`}
                </option>
              ))}
            </select>
          )}

          {/* Manual capture button */}
          <button
            onClick={() => captureImage()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex-shrink-0"
            disabled={isLoading}
          >
            Capture
          </button>
        </div>
      </div>

      {/* Thumbnail of last capture */}
      {lastCapture && (
        <div className="absolute top-4 right-4 w-24 h-24 bg-black rounded-lg overflow-hidden border-2 border-white">
          <img
            src={lastCapture.dataUrl}
            alt="Last capture"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs px-2 py-1 text-center">
            {imageSize} KB
          </div>
        </div>
      )}
    </div>
  );
};

export default Camera;
