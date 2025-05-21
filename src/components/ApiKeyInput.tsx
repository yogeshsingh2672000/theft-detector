import { useState, useEffect } from "react";

interface ApiKeyInputProps {
  onApiKeyChange: (apiKey: string) => void;
}

const ApiKeyInput = ({ onApiKeyChange }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [showKey, setShowKey] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("openai_api_key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
      onApiKeyChange(savedApiKey);
    }
  }, [onApiKeyChange]);

  // Save API key to localStorage and notify parent component
  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem("openai_api_key", newKey);
    onApiKeyChange(newKey);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-xl font-bold text-white mb-4">OpenAI API Key</h3>

      <div className="space-y-2">
        <p className="text-gray-300 text-sm">
          Enter your OpenAI API key to enable image analysis. Your key is stored
          locally and never sent to our servers.
        </p>

        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="sk-..."
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg pr-12"
          />

          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {showKey ? "Hide" : "Show"}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          You can get an API key from{" "}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            OpenAI's website
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default ApiKeyInput;
