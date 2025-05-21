import type { VoiceConfig, AzureConfig } from '../types';

class TtsService {
  private static instance: TtsService;
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private azureSpeechSynthesizer: any = null;
  private isUsingAzure = false;

  private constructor() {
    this.synthesis = window.speechSynthesis;
    
    // Load available voices
    this.loadVoices();
    
    // Some browsers (especially Safari) load voices asynchronously
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
    }
  }

  public static getInstance(): TtsService {
    if (!TtsService.instance) {
      TtsService.instance = new TtsService();
    }
    return TtsService.instance;
  }

  private loadVoices(): void {
    this.voices = this.synthesis.getVoices();
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  // Get Indian voices from Azure
  public getIndianVoices(pricingTier: 'standard' | 'premium' = 'standard'): { name: string; lang: string; gender: string; isAzure: boolean; premium: boolean }[] {
    const standardVoices = [
      { name: 'hi-IN-SwaraNeural', lang: 'hi-IN', gender: 'Female', isAzure: true, premium: false },
      { name: 'hi-IN-MadhurNeural', lang: 'hi-IN', gender: 'Male', isAzure: true, premium: false },
      { name: 'en-IN-NeerjaNeural', lang: 'en-IN', gender: 'Female', isAzure: true, premium: false },
      { name: 'en-IN-PrabhatNeural', lang: 'en-IN', gender: 'Male', isAzure: true, premium: false }
    ];
    
    const premiumVoices = [
      { name: 'hi-IN-SwaraNeural', lang: 'hi-IN', gender: 'Female', isAzure: true, premium: true },
      { name: 'hi-IN-MadhurNeural', lang: 'hi-IN', gender: 'Male', isAzure: true, premium: true },
      { name: 'en-IN-NeerjaNeural', lang: 'en-IN', gender: 'Female', isAzure: true, premium: true },
      { name: 'en-IN-PrabhatNeural', lang: 'en-IN', gender: 'Male', isAzure: true, premium: true }
    ];
    
    return pricingTier === 'premium' ? premiumVoices : standardVoices;
  }

  // Initialize Azure Speech SDK
  public async initAzure(config: AzureConfig): Promise<boolean> {
    try {
      // Dynamically import the Speech SDK
      const { SpeechConfig, AudioConfig, SpeechSynthesizer } = await import('microsoft-cognitiveservices-speech-sdk');
      
      // Create speech config
      const speechConfig = SpeechConfig.fromSubscription(
        config.subscriptionKey,
        config.region
      );
      
      // Set speech synthesis output format (24khz for premium, 16khz for standard)
      if (config.pricingTier === 'premium') {
        speechConfig.speechSynthesisOutputFormat = 24; // Use high quality format
      }
      
      // Create audio config (output to speaker)
      const audioConfig = AudioConfig.fromDefaultSpeakerOutput();
      
      // Create the synthesizer
      this.azureSpeechSynthesizer = new SpeechSynthesizer(speechConfig, audioConfig);
      this.isUsingAzure = true;
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Azure Speech SDK:', error);
      this.isUsingAzure = false;
      return false;
    }
  }

  public speak(text: string, config: VoiceConfig): void {
    // Check if we should use Azure
    if (this.isUsingAzure && config.isAzure && this.azureSpeechSynthesizer) {
      this.speakWithAzure(text, config);
    } else {
      this.speakWithBrowser(text, config);
    }
  }

  private speakWithBrowser(text: string, config: VoiceConfig): void {
    // Cancel any ongoing speech
    this.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find the voice by name
    const voice = this.voices.find(v => v.name === config.name);
    if (voice) {
      utterance.voice = voice;
    }
    
    // Set other properties
    utterance.lang = config.lang || 'en-US';
    
    if (config.rate !== undefined) {
      utterance.rate = config.rate;
    }
    
    if (config.pitch !== undefined) {
      utterance.pitch = config.pitch;
    }
    
    if (config.volume !== undefined) {
      utterance.volume = config.volume;
    }

    // Start speaking
    this.synthesis.speak(utterance);
  }

  private speakWithAzure(text: string, config: VoiceConfig): void {
    if (!this.azureSpeechSynthesizer) return;
    
    // Cancel any ongoing speech
    this.cancel();
    
    // Create SSML string with voice name and language
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${config.lang}">
        <voice name="${config.name}">
          <prosody rate="${(config.rate || 1.0) * 100 - 100}%" pitch="${(config.pitch || 1.0) * 100 - 100}%" volume="${(config.volume || 1.0) * 100}%">
            ${text}
          </prosody>
        </voice>
      </speak>
    `;
    
    // Speak with SSML
    this.azureSpeechSynthesizer.speakSsmlAsync(
      ssml,
      (result: any) => {
        if (result) {
          // Speech synthesis succeeded
          this.azureSpeechSynthesizer.close();
        }
      },
      (error: any) => {
        console.error('Speech synthesis error:', error);
        this.azureSpeechSynthesizer.close();
      }
    );
  }

  public cancel(): void {
    // Cancel browser speech synthesis
    this.synthesis.cancel();
    
    // Cancel Azure speech synthesis if active
    if (this.azureSpeechSynthesizer) {
      this.azureSpeechSynthesizer.close();
    }
  }

  public isPending(): boolean {
    return this.synthesis.pending;
  }

  public isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  public isPaused(): boolean {
    return this.synthesis.paused;
  }
}

export default TtsService; 