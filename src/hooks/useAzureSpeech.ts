import { useState, useCallback, useEffect } from 'react';
import type { AzureConfig } from '../types';

interface AzureSpeechState {
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

export const useAzureSpeech = (config: AzureConfig | null) => {
  const [state, setState] = useState<AzureSpeechState>({
    initialized: false,
    loading: false,
    error: null
  });
  const [speechSDK, setSpeechSDK] = useState<any>(null);

  // Initialize Azure Speech SDK
  const initialize = useCallback(async () => {
    if (!config?.subscriptionKey) {
      setState({
        initialized: false,
        loading: false,
        error: 'Azure Speech key is required'
      });
      return false;
    }

    setState({
      ...state,
      loading: true,
      error: null
    });

    try {
      // Dynamically import Azure Speech SDK
      const { SpeechConfig, AudioConfig, SpeechSynthesizer } = await import('microsoft-cognitiveservices-speech-sdk');
      
      // Create speech config
      const speechConfig = SpeechConfig.fromSubscription(
        config.subscriptionKey,
        config.region
      );

      // Set up Indian voice synthesis output format
      if (config.pricingTier === 'premium') {
        // Use higher quality format for premium tier
        speechConfig.speechSynthesisOutputFormat = 24; // riff-24khz-16bit-mono-pcm
      } else {
        // Use standard quality for standard tier
        speechConfig.speechSynthesisOutputFormat = 8; // riff-16khz-16bit-mono-pcm
      }

      setSpeechSDK({
        SpeechConfig,
        AudioConfig,
        SpeechSynthesizer,
        speechConfig
      });

      setState({
        initialized: true,
        loading: false,
        error: null
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize Azure Speech SDK:', error);
      setState({
        initialized: false,
        loading: false,
        error: 'Failed to initialize Azure Speech SDK'
      });
      return false;
    }
  }, [config, state]);

  // Speak text using Azure
  const speak = useCallback(async (text: string, voiceName: string, language: string) => {
    if (!speechSDK || !state.initialized) {
      console.error('Azure Speech SDK not initialized');
      return;
    }

    try {
      const { AudioConfig, SpeechSynthesizer } = speechSDK;
      const audioConfig = AudioConfig.fromDefaultSpeakerOutput();
      
      const synthesizer = new SpeechSynthesizer(
        speechSDK.speechConfig, 
        audioConfig
      );

      // Create SSML for Indian voice
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${language}">
          <voice name="${voiceName}">
            ${text}
          </voice>
        </speak>
      `;

      // Speak with SSML
      synthesizer.speakSsmlAsync(
        ssml,
        (result: any) => {
          if (result) {
            synthesizer.close();
          }
        },
        (error: any) => {
          console.error('Speech synthesis error:', error);
          synthesizer.close();
        }
      );
    } catch (error) {
      console.error('Error using Azure speech synthesis:', error);
    }
  }, [speechSDK, state.initialized]);

  // Re-initialize if config changes
  useEffect(() => {
    if (config?.subscriptionKey) {
      initialize();
    }
  }, [config?.subscriptionKey, config?.region, config?.pricingTier, initialize]);

  return {
    initialized: state.initialized,
    loading: state.loading,
    error: state.error,
    initialize,
    speak
  };
};

export default useAzureSpeech; 