import { useState, useCallback, useRef, useEffect } from 'react';
import type { ImageCapture } from '../types';

type UseCameraOptions = {
  captureInterval?: number; // in milliseconds
  enabled?: boolean;
  imageQuality?: number; // 0 to 1
  facingMode?: 'user' | 'environment';
};

const useCamera = (options: UseCameraOptions = {}) => {
  const {
    captureInterval = 5000, // default capture every 5 seconds
    enabled = true, // Camera is enabled by default
    imageQuality = 0.7,
    facingMode = 'environment', // default to back camera
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCapture, setLastCapture] = useState<ImageCapture | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Check if browser supports getUserMedia
  const checkBrowserSupport = useCallback(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Your browser does not support camera access. Please try a different browser.');
      setIsLoading(false);
      return false;
    }
    return true;
  }, []);

  // Get list of available cameras
  const getDevices = useCallback(async () => {
    if (!checkBrowserSupport()) return;

    try {
      // First request camera permissions (this can help with device enumeration)
      console.log('Requesting initial camera permissions...');
      const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Stop the initial stream after getting permissions
      initialStream.getTracks().forEach(track => track.stop());
      
      console.log('Enumerating devices...');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('Available camera devices:', videoDevices);
      
      if (videoDevices.length === 0) {
        setError('No camera devices detected on your device.');
        setIsLoading(false);
        return;
      }
      
      setDevices(videoDevices);
      
      // Try to find a back camera if facingMode is environment
      if (facingMode === 'environment' && videoDevices.length > 1) {
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        );
        
        if (backCamera) {
          console.log('Found back camera:', backCamera.label);
          setSelectedDevice(backCamera.deviceId);
        } else {
          // Just use the first camera
          setSelectedDevice(videoDevices[0].deviceId);
        }
      } else {
        // Just use the first camera
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error getting media devices:', err);
      setError('Camera access denied. Please allow camera access and reload the page.');
      setIsLoading(false);
    }
  }, [facingMode, checkBrowserSupport]);

  // Initialize camera
  const initCamera = useCallback(async () => {
    if (!checkBrowserSupport()) return;
    
    if (!selectedDevice && devices.length === 0) {
      console.log('No camera devices found yet, trying to get devices first');
      await getDevices();
      // If getDevices failed or set an error, don't continue
      if (error) return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Stop any existing streams
      if (streamRef.current) {
        console.log('Stopping existing stream');
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      console.log('Initializing camera with device:', selectedDevice || 'default', 'and facing mode:', facingMode);

      const constraints: MediaStreamConstraints = {
        video: {
          ...(selectedDevice ? { deviceId: { exact: selectedDevice } } : { facingMode }),
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      console.log('Using constraints:', constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        console.log('Setting video source to stream');
        videoRef.current.srcObject = stream;
        
        // Create a promise for video loaded to handle both events properly
        const videoLoadPromise = new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not available'));
            return;
          }
          
          // Handler for successful video loading
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              console.log('Video metadata loaded, dimensions:', 
                videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
              resolve();
            }
          };
          
          // Handler for video loading failure
          videoRef.current.onerror = (e) => {
            console.error('Video element error:', e);
            reject(new Error('Failed to load video'));
          };
        });
        
        try {
          // Wait for video to be loaded
          await videoLoadPromise;
          
          if (videoRef.current) {
            await videoRef.current.play();
            console.log('Video is playing successfully');
            setIsLoading(false);
          }
        } catch (e) {
          console.error('Error starting video playback:', e);
          setError('Failed to play video stream. Please reload the page.');
          setIsLoading(false);
        }
      } else {
        console.error('Video reference is null');
        setError('Cannot initialize video element');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      
      // More descriptive errors based on the type of error
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access denied. Please allow camera access in your browser settings and reload the page.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found. Please connect a camera and reload the page.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is in use by another application. Please close other apps using your camera.');
      } else {
        setError(`Failed to access camera: ${err.message || 'Unknown error'}`);
      }
      
      setIsLoading(false);
    }
  }, [facingMode, selectedDevice, devices.length, getDevices, error, checkBrowserSupport]);

  // Capture image from video stream
  const captureImage = useCallback((): ImageCapture | null => {
    if (!videoRef.current || !streamRef.current) {
      console.error('Cannot capture: video or stream reference is null');
      return null;
    }

    try {
      const video = videoRef.current;
      
      // Check if video has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error('Video dimensions are zero, cannot capture');
        return null;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Draw the video frame to the canvas
      ctx.drawImage(video, 0, 0);
      
      // Convert canvas to data URL (image)
      const dataUrl = canvas.toDataURL('image/jpeg', imageQuality);
      
      const capture = {
        dataUrl,
        timestamp: Date.now()
      };
      
      // Update last capture state
      setLastCapture(capture);
      console.log('Image captured successfully');
      
      return capture;
    } catch (err) {
      console.error('Error capturing image:', err);
      return null;
    }
  }, [imageQuality]);

  // Switch camera device
  const selectDevice = useCallback((deviceId: string) => {
    console.log('Switching to device:', deviceId);
    setSelectedDevice(deviceId);
  }, []);

  // Start automated capturing
  const startCapturing = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    
    console.log('Starting automatic capture every', captureInterval, 'ms');
    
    intervalRef.current = window.setInterval(() => {
      captureImage();
    }, captureInterval);
  }, [captureInterval, captureImage]);

  // Stop automated capturing
  const stopCapturing = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('Stopped automatic capture');
    }
  }, []);

  // Initialize camera when component mounts
  useEffect(() => {
    console.log('Camera hook initialized, checking browser support');
    if (checkBrowserSupport()) {
      console.log('Browser supports camera, getting devices');
      getDevices();
    }
    
    // Cleanup: stop all tracks and clear interval on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [getDevices, checkBrowserSupport]);

  // Reinitialize camera when selected device changes
  useEffect(() => {
    if (enabled && selectedDevice) {
      console.log('Device changed or camera enabled, initializing camera');
      initCamera();
    }
  }, [enabled, initCamera, selectedDevice]);

  // Handle auto-capturing
  useEffect(() => {
    if (enabled && streamRef.current && !isLoading && !error) {
      startCapturing();
    } else {
      stopCapturing();
    }
    
    return () => {
      stopCapturing();
    };
  }, [enabled, startCapturing, stopCapturing, streamRef, isLoading, error]);

  return {
    videoRef,
    devices,
    selectedDevice,
    selectDevice,
    isLoading,
    error,
    lastCapture,
    captureImage,
    startCapturing,
    stopCapturing,
  };
};

export default useCamera; 