import { useState } from "react";
import { useTts } from "../contexts/TtsContext";

const VoiceSettings = () => {
  const {
    ttsConfig,
    availableVoices,
    availableIndianVoices,
    updateVoice,
    toggleEnabled,
    toggleAutoSpeak,
    toggleAzureEnabled,
    updateAzureConfig,
    initializeAzure,
    speak,
  } = useTts();

  const [expanded, setExpanded] = useState(false);
  const [showAzureConfig, setShowAzureConfig] = useState(false);
  const [azureKeyInput, setAzureKeyInput] = useState(
    ttsConfig.azureConfig?.subscriptionKey || ""
  );
  const [azureRegionInput, setAzureRegionInput] = useState(
    ttsConfig.azureConfig?.region || "eastus"
  );

  // Test the current voice
  const testVoice = () => {
    speak("This is a test of the current voice settings.");
  };

  // Save Azure config
  const saveAzureConfig = async () => {
    updateAzureConfig({
      subscriptionKey: azureKeyInput,
      region: azureRegionInput,
    });

    await initializeAzure();
  };

  // Select an Indian voice
  const selectIndianVoice = (voiceName: string) => {
    const selectedVoice = availableIndianVoices.find(
      (v) => v.name === voiceName
    );
    if (selectedVoice) {
      updateVoice({
        name: selectedVoice.name,
        lang: selectedVoice.lang,
        isAzure: true,
        gender: selectedVoice.gender,
        premium: selectedVoice.premium,
      });
    }
  };

  // Filter Indian voices by language
  const hindiVoices = availableIndianVoices.filter((v) => v.lang === "hi-IN");
  const indianEnglishVoices = availableIndianVoices.filter(
    (v) => v.lang === "en-IN"
  );

  return (
    <div className="bg-gray-800 rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Voice Settings</h3>
        <button onClick={() => setExpanded(!expanded)} className="text-white">
          {expanded ? "▲ Hide" : "▼ Show"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Azure voice toggle */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">
                Use Indian Voices (Azure)
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ttsConfig.azureEnabled}
                  onChange={toggleAzureEnabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Azure Configuration Section */}
          {ttsConfig.azureEnabled && (
            <div className="bg-gray-700 p-3 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">
                  Azure Configuration
                </h4>
                <button
                  onClick={() => setShowAzureConfig(!showAzureConfig)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  {showAzureConfig ? "Hide" : "Show"}
                </button>
              </div>

              {showAzureConfig && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">
                      Azure Speech Key
                    </label>
                    <input
                      type="password"
                      value={azureKeyInput}
                      onChange={(e) => setAzureKeyInput(e.target.value)}
                      className="w-full bg-gray-600 rounded p-2 text-white text-sm"
                      placeholder="Enter your Azure Speech API key"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-300 mb-1">
                      Azure Region
                    </label>
                    <select
                      value={azureRegionInput}
                      onChange={(e) => setAzureRegionInput(e.target.value)}
                      className="w-full bg-gray-600 rounded p-2 text-white text-sm"
                    >
                      <option value="eastus">East US</option>
                      <option value="eastus2">East US 2</option>
                      <option value="southeastasia">Southeast Asia</option>
                      <option value="westeurope">West Europe</option>
                      <option value="centralindia">Central India</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-300 mb-1">
                      Pricing Tier
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div
                        className={`p-2 rounded-lg border ${
                          ttsConfig.azureConfig?.pricingTier === "standard"
                            ? "border-blue-500 bg-blue-900/30"
                            : "border-gray-600 bg-gray-700"
                        } cursor-pointer hover:bg-gray-600 transition-colors`}
                        onClick={() =>
                          updateAzureConfig({ pricingTier: "standard" })
                        }
                      >
                        <div className="font-medium text-white">Standard</div>
                        <div className="text-xs text-gray-300">
                          Lower cost, slower response
                        </div>
                      </div>
                      <div
                        className={`p-2 rounded-lg border ${
                          ttsConfig.azureConfig?.pricingTier === "premium"
                            ? "border-blue-500 bg-blue-900/30"
                            : "border-gray-600 bg-gray-700"
                        } cursor-pointer hover:bg-gray-600 transition-colors`}
                        onClick={() =>
                          updateAzureConfig({ pricingTier: "premium" })
                        }
                      >
                        <div className="font-medium text-white">Premium</div>
                        <div className="text-xs text-gray-300">
                          Higher cost, real-time response
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={saveAzureConfig}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm w-full"
                  >
                    Save Azure Configuration
                  </button>
                </div>
              )}

              {/* Voice selection for Indian voices */}
              {ttsConfig.azureConfig?.subscriptionKey && (
                <div className="space-y-3 pt-2">
                  <div>
                    <h5 className="text-sm font-medium text-white mb-2">
                      Hindi Voices
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      {hindiVoices.map((voice) => (
                        <div
                          key={voice.name}
                          className={`p-2 rounded-lg border ${
                            ttsConfig.voice.name === voice.name
                              ? "border-blue-500 bg-blue-900/30"
                              : "border-gray-600 bg-gray-700"
                          } cursor-pointer hover:bg-gray-600 transition-colors`}
                          onClick={() => selectIndianVoice(voice.name)}
                        >
                          <div className="font-medium text-white">
                            {voice.gender}
                          </div>
                          <div className="text-xs text-gray-300">
                            {voice.premium ? "Premium" : "Standard"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-white mb-2">
                      Indian English Voices
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      {indianEnglishVoices.map((voice) => (
                        <div
                          key={voice.name}
                          className={`p-2 rounded-lg border ${
                            ttsConfig.voice.name === voice.name
                              ? "border-blue-500 bg-blue-900/30"
                              : "border-gray-600 bg-gray-700"
                          } cursor-pointer hover:bg-gray-600 transition-colors`}
                          onClick={() => selectIndianVoice(voice.name)}
                        >
                          <div className="font-medium text-white">
                            {voice.gender}
                          </div>
                          <div className="text-xs text-gray-300">
                            {voice.premium ? "Premium" : "Standard"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Browser voice selection (when Azure is disabled) */}
          {!ttsConfig.azureEnabled && (
            <div className="space-y-2">
              <label
                htmlFor="voice-select"
                className="block text-sm font-medium text-gray-300"
              >
                Voice
              </label>
              <select
                id="voice-select"
                value={ttsConfig.voice.name}
                onChange={(e) => {
                  const selectedVoice = availableVoices.find(
                    (v) => v.name === e.target.value
                  );
                  if (selectedVoice) {
                    updateVoice({
                      name: selectedVoice.name,
                      lang: selectedVoice.lang,
                      isAzure: false,
                    });
                  }
                }}
                className="w-full bg-gray-700 rounded p-2 text-white"
              >
                {availableVoices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Common voice settings */}
          <div className="space-y-2">
            <label
              htmlFor="rate-slider"
              className="block text-sm font-medium text-gray-300"
            >
              Rate: {ttsConfig.voice.rate?.toFixed(1) || 1.0}
            </label>
            <input
              id="rate-slider"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={ttsConfig.voice.rate || 1}
              onChange={(e) =>
                updateVoice({ rate: parseFloat(e.target.value) })
              }
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="pitch-slider"
              className="block text-sm font-medium text-gray-300"
            >
              Pitch: {ttsConfig.voice.pitch?.toFixed(1) || 1.0}
            </label>
            <input
              id="pitch-slider"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={ttsConfig.voice.pitch || 1}
              onChange={(e) =>
                updateVoice({ pitch: parseFloat(e.target.value) })
              }
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="volume-slider"
              className="block text-sm font-medium text-gray-300"
            >
              Volume: {ttsConfig.voice.volume?.toFixed(1) || 1.0}
            </label>
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={ttsConfig.voice.volume || 1}
              onChange={(e) =>
                updateVoice({ volume: parseFloat(e.target.value) })
              }
              className="w-full"
            />
          </div>

          {/* Toggle switches */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">
                Enable Voice
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ttsConfig.enabled}
                  onChange={toggleEnabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">
                Auto-speak Results
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ttsConfig.autoSpeak}
                  onChange={toggleAutoSpeak}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Test voice button */}
          <button
            onClick={testVoice}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full"
            disabled={
              !ttsConfig.enabled ||
              (ttsConfig.azureEnabled &&
                !ttsConfig.azureConfig?.subscriptionKey)
            }
          >
            Test Voice
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceSettings;
