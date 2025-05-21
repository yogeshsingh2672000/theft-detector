import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { analyzeImage } from '../services/openaiService';
import { compressImage, getBase64FromDataUrl } from '../utils/imageUtils';
import type { VisionAnalysisResult, ImageCapture } from '../types';

type UseVisionAnalysisOptions = {
  apiKey: string;
  autoAnalyze?: boolean;
  analysisDelay?: number; // Milliseconds to wait between analyses
  maxImageWidth?: number;
  imageQuality?: number;
};

const useVisionAnalysis = (options: UseVisionAnalysisOptions) => {
  const { 
    apiKey, 
    autoAnalyze = false, 
    analysisDelay = 5000,
    maxImageWidth = 800,
    imageQuality = 0.7
  } = options;
  
  const [analysisResults, setAnalysisResults] = useState<VisionAnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessedTimestamp, setLastProcessedTimestamp] = useState(0);
  
  // Set up the mutation for analyzing images
  const analysisMutation = useMutation({
    mutationFn: async ({
      imageBase64,
      prompt
    }: {
      imageBase64: string;
      prompt?: string;
    }) => {
      return analyzeImage(apiKey, imageBase64, prompt);
    },
    onSuccess: (data) => {
      setAnalysisResults(data);
      setLastProcessedTimestamp(Date.now());
      setIsProcessing(false);
    },
    onError: (error) => {
      console.error('Error in vision analysis:', error);
      setIsProcessing(false);
    }
  });
  
  // Function to process an image
  const processImage = useCallback(
    async (capture: ImageCapture, customPrompt?: string) => {
      if (!apiKey || isProcessing) {
        return;
      }
      
      const currentTime = Date.now();
      
      // If auto-analyze is enabled, respect the delay between analyses
      if (autoAnalyze && currentTime - lastProcessedTimestamp < analysisDelay) {
        return;
      }
      
      try {
        setIsProcessing(true);
        
        // Compress the image before sending to API
        const compressedDataUrl = await compressImage(
          capture.dataUrl,
          maxImageWidth,
          imageQuality
        );
        
        // Extract base64 data from dataUrl (remove "data:image/jpeg;base64," prefix)
        const base64Data = getBase64FromDataUrl(compressedDataUrl);
        
        // Trigger the analysis mutation
        analysisMutation.mutate({
          imageBase64: base64Data,
          prompt: customPrompt
        });
      } catch (error) {
        console.error('Error processing image:', error);
        setIsProcessing(false);
      }
    },
    [
      apiKey, 
      analysisMutation, 
      analysisDelay, 
      autoAnalyze, 
      isProcessing, 
      lastProcessedTimestamp,
      maxImageWidth,
      imageQuality
    ]
  );
  
  // Clear the analysis results
  const clearResults = useCallback(() => {
    setAnalysisResults(null);
  }, []);
  
  return {
    analysisResults,
    isProcessing,
    processImage,
    clearResults,
    error: analysisMutation.error
  };
};

export default useVisionAnalysis; 