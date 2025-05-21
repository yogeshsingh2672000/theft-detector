import { useState, useEffect, useCallback } from "react";
import Camera from "./Camera";
import AnalysisResults from "./AnalysisResults";
import VoiceSettings from "./VoiceSettings";
import ApiKeyInput from "./ApiKeyInput";
import useVisionAnalysis from "../hooks/useVisionAnalysis";
import type { ImageCapture } from "../types";

const TheftDetector = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [analyzeInterval, setAnalyzeInterval] = useState(10000); // 10 seconds
  const [lastCaptureData, setLastCaptureData] = useState<string | null>(null);

  const { analysisResults, isProcessing, processImage, error } =
    useVisionAnalysis({
      apiKey,
      autoAnalyze,
      analysisDelay: analyzeInterval,
    });

  // Handle image capture from the camera
  const handleCapture = useCallback(
    (dataUrl: string) => {
      setLastCaptureData(dataUrl);

      if (apiKey && autoAnalyze) {
        const capture: ImageCapture = {
          dataUrl,
          timestamp: Date.now(),
        };

        processImage(capture);
      }
    },
    [apiKey, autoAnalyze, processImage]
  );

  // Manually trigger analysis of the last captured image
  const triggerAnalysis = useCallback(() => {
    if (lastCaptureData && apiKey) {
      const capture: ImageCapture = {
        dataUrl: lastCaptureData,
        timestamp: Date.now(),
      };

      processImage(capture);
    }
  }, [apiKey, lastCaptureData, processImage]);

  // Set up interval for automatic analysis
  useEffect(() => {
    let intervalId: number | null = null;

    if (autoAnalyze && apiKey && lastCaptureData) {
      intervalId = window.setInterval(() => {
        if (lastCaptureData) {
          const capture: ImageCapture = {
            dataUrl: lastCaptureData,
            timestamp: Date.now(),
          };

          processImage(capture);
        }
      }, analyzeInterval);
    }

    return () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [autoAnalyze, apiKey, analyzeInterval, lastCaptureData, processImage]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <ApiKeyInput onApiKeyChange={setApiKey} />

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-xl font-bold text-white mb-4">Camera Feed</h3>
            <Camera
              onCapture={handleCapture}
              autoCapture={true}
              captureInterval={5000} // Capture every 5 seconds
              className="w-full aspect-video"
            />

            <div className="mt-4 space-y-4">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">
                    Auto-analyze Images
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoAnalyze}
                      onChange={() => setAutoAnalyze(!autoAnalyze)}
                      className="sr-only peer"
                      disabled={!apiKey}
                    />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                  </label>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="interval-slider"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Analysis Interval: {(analyzeInterval / 1000).toFixed(0)}{" "}
                    seconds
                  </label>
                  <input
                    id="interval-slider"
                    type="range"
                    min="3000"
                    max="30000"
                    step="1000"
                    value={analyzeInterval}
                    onChange={(e) =>
                      setAnalyzeInterval(parseInt(e.target.value))
                    }
                    className="w-full"
                    disabled={!autoAnalyze}
                  />
                </div>

                <button
                  onClick={triggerAnalysis}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full mt-2"
                  disabled={!apiKey || !lastCaptureData || isProcessing}
                >
                  {isProcessing ? "Analyzing..." : "Analyze Now"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <AnalysisResults
            results={analysisResults}
            isLoading={isProcessing}
            error={error}
          />

          <VoiceSettings />
        </div>
      </div>
    </div>
  );
};

export default TheftDetector;
