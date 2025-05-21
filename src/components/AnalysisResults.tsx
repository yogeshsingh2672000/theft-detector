import { useEffect } from "react";
import type { VisionAnalysisResult } from "../types";
import { useTts } from "../contexts/TtsContext";

interface AnalysisResultsProps {
  results: VisionAnalysisResult | null;
  isLoading: boolean;
  error: unknown;
}

// Helper function to enhance text with more natural Indian English expressions
const enhanceTextForIndianVoice = (text: string, isHindi: boolean): string => {
  if (isHindi) {
    // For Hindi voice, we can add Hindi phrases
    const securityRiskText = text.includes("Alert")
      ? text
          .replace("Alert:", "चेतावनी:")
          .replace("high risk:", "उच्च जोखिम:")
          .replace("medium risk:", "मध्यम जोखिम:")
          .replace("low risk:", "कम जोखिम:")
      : text;

    return securityRiskText.replace(
      "No security risks detected.",
      "कोई सुरक्षा जोखिम नहीं मिला।"
    );
  } else {
    // For Indian English voice, add common Indian English phrases
    let enhancedText = text;

    // Add Indian English filler phrases
    if (text.includes("Alert")) {
      enhancedText = enhancedText.replace(
        "Alert:",
        "Listen carefully, there is a security alert! "
      );
    }

    if (text.includes("No security risks detected")) {
      enhancedText = enhancedText.replace(
        "No security risks detected.",
        "Everything is fine, no security risks detected."
      );
    }

    return enhancedText;
  }
};

const AnalysisResults = ({
  results,
  isLoading,
  error,
}: AnalysisResultsProps) => {
  const { speak, ttsConfig } = useTts();

  // Automatically speak the analysis when we get results
  useEffect(() => {
    if (results && ttsConfig.autoSpeak && ttsConfig.enabled) {
      const isHindiVoice = ttsConfig.voice.lang?.includes("hi-IN") || false;

      // Create base text for the analysis
      let textToSpeak = `${results.description}. 
      ${
        results.risks.length > 0
          ? `Alert: ${results.risks
              .map((risk) => `${risk.level} risk: ${risk.description}`)
              .join(". ")}`
          : "No security risks detected."
      }`;

      // Enhance the text to sound more natural for Indian voices
      if (ttsConfig.voice.isAzure) {
        textToSpeak = enhanceTextForIndianVoice(textToSpeak, isHindiVoice);
      }

      speak(textToSpeak);
    }
  }, [results, speak, ttsConfig.autoSpeak, ttsConfig.enabled, ttsConfig.voice]);

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 mt-4 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6 mb-4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 bg-opacity-50 rounded-lg p-6 mt-4">
        <h3 className="text-xl font-bold text-red-300 mb-2">Analysis Error</h3>
        <p className="text-white">
          There was an error analyzing the image. Please try again or check your
          API key.
        </p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 mt-4">
        <p className="text-gray-400 text-center">
          Capture an image to see the analysis results here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 mt-4">
      <h3 className="text-xl font-bold text-white mb-4">Analysis Results</h3>

      <div className="mb-4">
        <h4 className="text-lg font-medium text-gray-300 mb-2">Description</h4>
        <p className="text-white">{results.description}</p>
      </div>

      {results.objects.length > 0 && (
        <div className="mb-4">
          <h4 className="text-lg font-medium text-gray-300 mb-2">
            Objects Detected
          </h4>
          <div className="flex flex-wrap gap-2">
            {results.objects.map((object, index) => (
              <span
                key={index}
                className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm"
              >
                {object}
              </span>
            ))}
          </div>
        </div>
      )}

      {results.actions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-lg font-medium text-gray-300 mb-2">Actions</h4>
          <div className="flex flex-wrap gap-2">
            {results.actions.map((action, index) => (
              <span
                key={index}
                className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm"
              >
                {action}
              </span>
            ))}
          </div>
        </div>
      )}

      {results.risks.length > 0 && (
        <div className="mb-4">
          <h4 className="text-lg font-medium text-gray-300 mb-2">
            Security Risks
          </h4>
          <div className="space-y-2">
            {results.risks.map((risk, index) => (
              <div
                key={index}
                className={`p-3 rounded ${
                  risk.level === "high"
                    ? "bg-red-900 bg-opacity-50 border-l-4 border-red-500"
                    : risk.level === "medium"
                    ? "bg-yellow-900 bg-opacity-50 border-l-4 border-yellow-500"
                    : "bg-blue-900 bg-opacity-50 border-l-4 border-blue-500"
                }`}
              >
                <div className="flex items-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      risk.level === "high"
                        ? "bg-red-500"
                        : risk.level === "medium"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }`}
                  ></span>
                  <span className="text-white font-medium capitalize">
                    {risk.level} Risk
                  </span>
                </div>
                <p className="text-white mt-1">{risk.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.risks.length === 0 && (
        <div className="mb-4 p-3 bg-green-900 bg-opacity-30 border-l-4 border-green-500 rounded">
          <p className="text-green-300">
            No security risks detected in this image.
          </p>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-4">
        Analysis timestamp: {new Date().toLocaleString()}
      </div>
    </div>
  );
};

export default AnalysisResults;
