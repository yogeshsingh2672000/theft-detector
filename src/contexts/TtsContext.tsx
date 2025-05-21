import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import TtsService from "../services/ttsService";
import type { VoiceConfig, TtsConfig, AzureConfig } from "../types";

// Default TTS configuration
const DEFAULT_TTS_CONFIG: TtsConfig = {
  voice: {
    name: "",
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    lang: "en-US",
  },
  enabled: true,
  autoSpeak: true,
  azureEnabled: false,
};

// Default Azure configuration
const DEFAULT_AZURE_CONFIG: AzureConfig = {
  subscriptionKey: "",
  region: "eastus",
  pricingTier: "standard",
};

// Context type
type TtsContextType = {
  ttsConfig: TtsConfig;
  availableVoices: SpeechSynthesisVoice[];
  availableIndianVoices: {
    name: string;
    lang: string;
    gender: string;
    isAzure: boolean;
    premium: boolean;
  }[];
  speak: (text: string) => void;
  cancel: () => void;
  updateVoice: (voice: Partial<VoiceConfig>) => void;
  toggleEnabled: () => void;
  toggleAutoSpeak: () => void;
  toggleAzureEnabled: () => void;
  updateAzureConfig: (config: Partial<AzureConfig>) => void;
  initializeAzure: () => Promise<boolean>;
  isSpeaking: boolean;
};

// Create the context
const TtsContext = createContext<TtsContextType | null>(null);

// Provider component
export const TtsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const ttsService = TtsService.getInstance();
  const [ttsConfig, setTtsConfig] = useState<TtsConfig>(() => {
    // Try to load from localStorage
    const savedConfig = localStorage.getItem("ttsConfig");
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig) as TtsConfig;
      } catch (e) {
        return DEFAULT_TTS_CONFIG;
      }
    }
    return DEFAULT_TTS_CONFIG;
  });

  // Initialize Azure config from saved settings or defaults
  const [azureConfig, setAzureConfig] = useState<AzureConfig>(() => {
    if (ttsConfig.azureConfig) {
      return ttsConfig.azureConfig;
    }
    return DEFAULT_AZURE_CONFIG;
  });

  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);

  const [availableIndianVoices, setAvailableIndianVoices] = useState<
    {
      name: string;
      lang: string;
      gender: string;
      isAzure: boolean;
      premium: boolean;
    }[]
  >([]);

  const [isSpeaking, setIsSpeaking] = useState(false);

  // Load available voices on mount
  useEffect(() => {
    const voices = ttsService.getAvailableVoices();
    setAvailableVoices(voices);

    // Get Indian voices
    const indianVoices = ttsService.getIndianVoices(azureConfig.pricingTier);
    setAvailableIndianVoices(indianVoices);

    // If no voice is set yet or the selected voice isn't available, pick the first English voice
    if (
      !ttsConfig.voice.name ||
      (!ttsConfig.voice.isAzure &&
        !voices.some((v) => v.name === ttsConfig.voice.name))
    ) {
      const englishVoice =
        voices.find((v) => v.lang.includes("en-")) || voices[0];
      if (englishVoice) {
        updateVoice({
          name: englishVoice.name,
          lang: englishVoice.lang,
        });
      }
    }

    // Handle voice list changes (might happen asynchronously in some browsers)
    const handleVoicesChanged = () => {
      const updatedVoices = ttsService.getAvailableVoices();
      setAvailableVoices(updatedVoices);
    };

    if ("onvoiceschanged" in speechSynthesis) {
      speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
    }

    return () => {
      if ("onvoiceschanged" in speechSynthesis) {
        speechSynthesis.removeEventListener(
          "voiceschanged",
          handleVoicesChanged
        );
      }
    };
  }, [ttsService, ttsConfig.voice.name, azureConfig.pricingTier]);

  // Initialize Azure TTS if enabled
  useEffect(() => {
    if (ttsConfig.azureEnabled && ttsConfig.azureConfig?.subscriptionKey) {
      initializeAzure();
    }
  }, [ttsConfig.azureEnabled, ttsConfig.azureConfig?.subscriptionKey]);

  // Save config to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("ttsConfig", JSON.stringify(ttsConfig));
  }, [ttsConfig]);

  // Set up a polling interval to check if speech is active
  useEffect(() => {
    const checkSpeaking = () => {
      setIsSpeaking(ttsService.isSpeaking());
    };

    const interval = setInterval(checkSpeaking, 100);
    return () => clearInterval(interval);
  }, [ttsService]);

  // Initialize Azure
  const initializeAzure = useCallback(async () => {
    if (!ttsConfig.azureConfig?.subscriptionKey) return false;

    try {
      const success = await ttsService.initAzure(ttsConfig.azureConfig);
      return success;
    } catch (error) {
      console.error("Failed to initialize Azure TTS:", error);
      return false;
    }
  }, [ttsConfig.azureConfig, ttsService]);

  // Speak text
  const speak = useCallback(
    (text: string) => {
      if (!ttsConfig.enabled) return;
      ttsService.speak(text, ttsConfig.voice);
      setIsSpeaking(true);
    },
    [ttsConfig, ttsService]
  );

  // Cancel speech
  const cancel = useCallback(() => {
    ttsService.cancel();
    setIsSpeaking(false);
  }, [ttsService]);

  // Update voice settings
  const updateVoice = useCallback((voice: Partial<VoiceConfig>) => {
    setTtsConfig((prev) => ({
      ...prev,
      voice: {
        ...prev.voice,
        ...voice,
      },
    }));
  }, []);

  // Update Azure config
  const updateAzureConfig = useCallback(
    (config: Partial<AzureConfig>) => {
      const newConfig = { ...azureConfig, ...config };
      setAzureConfig(newConfig);

      setTtsConfig((prev) => ({
        ...prev,
        azureConfig: newConfig,
      }));

      // Update available Indian voices if pricing tier changed
      if (
        config.pricingTier &&
        config.pricingTier !== azureConfig.pricingTier
      ) {
        const indianVoices = ttsService.getIndianVoices(config.pricingTier);
        setAvailableIndianVoices(indianVoices);
      }
    },
    [azureConfig, ttsService]
  );

  // Toggle TTS enabled state
  const toggleEnabled = useCallback(() => {
    setTtsConfig((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }));

    // If disabling, also cancel any ongoing speech
    if (ttsConfig.enabled) {
      cancel();
    }
  }, [cancel, ttsConfig.enabled]);

  // Toggle Azure TTS enabled state
  const toggleAzureEnabled = useCallback(() => {
    setTtsConfig((prev) => ({
      ...prev,
      azureEnabled: !prev.azureEnabled,
    }));
  }, []);

  // Toggle auto-speak setting
  const toggleAutoSpeak = useCallback(() => {
    setTtsConfig((prev) => ({
      ...prev,
      autoSpeak: !prev.autoSpeak,
    }));
  }, []);

  const contextValue: TtsContextType = {
    ttsConfig,
    availableVoices,
    availableIndianVoices,
    speak,
    cancel,
    updateVoice,
    toggleEnabled,
    toggleAutoSpeak,
    toggleAzureEnabled,
    updateAzureConfig,
    initializeAzure,
    isSpeaking,
  };

  return (
    <TtsContext.Provider value={contextValue}>{children}</TtsContext.Provider>
  );
};

// Custom hook to use the TTS context
export const useTts = () => {
  const context = useContext(TtsContext);

  if (context === null) {
    throw new Error("useTts must be used within a TtsProvider");
  }

  return context;
};

export default TtsContext;
