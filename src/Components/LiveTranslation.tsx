import React, { useState, useEffect, useRef } from 'react';
import styles from './LiveTranslation.module.css';

interface Transcription {
  originalText?: string;
  translatedText: string;
  isError?: boolean;
  isSummary?: boolean;
  isLoading?: boolean;
  isEnglish?: boolean;
}

const LiveTranslation: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [recordingStatus, setRecordingStatus] = useState('Recording stopped');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showFullTranscription, setShowFullTranscription] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<AudioWorkletNode | null>(null);
  const vadAnalyserRef = useRef<AnalyserNode | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const audioBufferRef = useRef<Float32Array[]>([]);
  const chunkNumberRef = useRef(0);
  const chunkStartTimeRef = useRef(0);
  const silenceStartTimeRef = useRef(0);
  const speechStartTimeRef = useRef(0);
  const activeRecordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const vadCooldownRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  let isRecordingLocal = false;

  // Ref to store the ping interval ID
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const CHUNK_DURATION_MS = 3000;
  const VAD_SETTINGS = {
    silenceThreshold: 0.03,
    minSilenceDuration: 1000,
    minSpeechDuration: 200,
    autoStopTimeout: 15000,
    cooldownPeriod: 500,
  };

  useEffect(() => {
    initWebSocket();
    return () => {
      cleanupAudio(); // Cleans up audio resources

      // Clear ping interval if it's active
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      // Cleanly close WebSocket connection
      if (websocketRef.current) {
        console.log('Closing WebSocket from useEffect cleanup.');
        // Remove event listeners to prevent them from firing during cleanup
        // especially onclose which might trigger reconnection logic
        websocketRef.current.onopen = null;
        websocketRef.current.onmessage = null;
        websocketRef.current.onerror = null;
        websocketRef.current.onclose = null; // Prevent onclose handler from running
        websocketRef.current.close();
        websocketRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  const initWebSocket = () => {
    // If a WebSocket instance already exists and is connecting or open, do nothing.
    // This helps prevent multiple connections if initWebSocket is called unexpectedly.
    if (websocketRef.current && (websocketRef.current.readyState === WebSocket.CONNECTING || websocketRef.current.readyState === WebSocket.OPEN)) {
        console.log('WebSocket is already connecting or open.');
        return;
    }

    // Clear any existing ping interval before trying to connect
    if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
    }

    const connect = () => {
      try {
        // If there's an old WebSocket ref with handlers, clear them before creating a new one.
        if (websocketRef.current) {
            websocketRef.current.onopen = null;
            websocketRef.current.onmessage = null;
            websocketRef.current.onerror = null;
            websocketRef.current.onclose = null;
        }
        websocketRef.current = new WebSocket('ws://127.0.0.1:8000/ws/audio/');
        console.log('WebSocket initialized: ws://127.0.0.1:8000/ws/audio/');
      } catch (error) {
        console.error('WebSocket initialization error:', error);
        setConnectionStatus('Error');
        setTranscriptions((prev) => [
          ...prev,
          { translatedText: 'WebSocket initialization failed', isError: true },
        ]);
        return;
      }

      websocketRef.current.onopen = () => {
        setConnectionStatus('Connected');
        reconnectAttemptsRef.current = 0;
        setTranscriptions((prev) => [
          ...prev,
          { translatedText: 'WebSocket connected', isError: false },
        ]);

        // Clear any existing interval before setting a new one
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (websocketRef.current?.readyState === WebSocket.OPEN) {
            websocketRef.current.send(JSON.stringify({ event: 'ping' }));
            console.log('Sent ping');
          }
        }, 10000);
      };

      websocketRef.current.onclose = (event) => {
        setConnectionStatus('Disconnected');
        console.log(`WebSocket closed: code=${event.code}, reason=${event.reason}`);

        // Clear ping interval on close
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Only attempt to reconnect if the closure was not initiated by the component unmounting
        // (The useEffect cleanup now sets onclose to null before closing)
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(Math.pow(2, reconnectAttemptsRef.current) * 2000, 16000);
          reconnectAttemptsRef.current += 1;
          setTranscriptions((prev) => [
            ...prev,
            { translatedText: `WebSocket disconnected, reconnecting in ${delay/1000}s...`, isError: true },
          ]);
          setTimeout(connect, delay);
        } else {
          setTranscriptions((prev) => [
            ...prev,
            { translatedText: 'Failed to reconnect to WebSocket after multiple attempts', isError: true },
          ]);
        }
      };

      websocketRef.current.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        // ...(rest of your onmessage logic remains the same)
        const message = JSON.parse(event.data as string);
        if (message.event === 'ping' || message.event === 'pong') {
          console.log(`Received ${message.event}:`, message.data);
          return;
        }
        if (message.event === 'transcription_result') {
          const data = message.data;
          setTranscriptions((prev) => prev.filter((t) => !t.isLoading));
          if (data.error) {
            setTranscriptions((prev) => [
              ...prev,
              { translatedText: `Error: ${data.error}`, isError: true },
            ]);
          } else {
            setTranscriptions((prev) => [
              ...prev,
              {
                originalText: data.originalText,
                translatedText: data.translatedText || data.originalText,
                isEnglish: data.isEnglish,
              },
            ]);
          }
        } else if (message.event === 'session_summary') {
          const data = message.data;
          setTranscriptions((prev) => prev.filter((t) => !t.isLoading));
          if (data.error) {
            setTranscriptions((prev) => [
              ...prev,
              { translatedText: `Session summary error: ${data.error}`, isError: true },
            ]);
          } else {
            setTranscriptions((prev) => [
              ...prev,
              {
                translatedText: data.summary,
                originalText: data.originalText,
                isSummary: true,
                isEnglish: data.isEnglish,
              },
            ]);
          }
        }
      };

      websocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error, 'readyState:', websocketRef.current?.readyState);
        setConnectionStatus('Error');
        // The onclose event will usually follow an error, which will handle reconnection.
        // You might not need to add a message here if onclose covers it.
        setTranscriptions((prev) => [
          ...prev,
          { translatedText: 'WebSocket connection error', isError: true },
        ]);
      };
    };

    connect();
  };

  

  const startRecording = async () => {
    try {
      audioContextRef.current = new AudioContext();
      console.log('AudioContext state:', audioContextRef.current.state);
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log('AudioContext resumed');
      }

      try {
        console.log('Loading AudioWorklet module from /audio-processor.js');
        await audioContextRef.current.audioWorklet.addModule('/audio-processor.js');
        console.log('AudioWorklet module loaded successfully');
      } catch (error) {
        console.error('Error loading AudioWorklet module:', error);
        setRecordingStatus('Error: Failed to load AudioWorklet module.');
        return false;
      }

      try {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        console.log('MediaStream assigned:', !!mediaStreamRef.current);
      } catch (error) {
        console.error('Failed to get user media:', error);
        setRecordingStatus('Error: Failed to access microphone. Please check permissions.');
        return false;
      }

      const tracks = mediaStreamRef.current.getAudioTracks();
      console.log(`Microphone tracks: ${tracks.length}, active: ${tracks[0]?.enabled}`);
      if (!tracks[0]?.enabled) {
        console.error('Microphone track is not enabled');
        setRecordingStatus('Error: Microphone is disabled.');
        return false;
      }

      const testMic = async () => {
        console.log('Testing microphone with MediaRecorder...');
        if (!mediaStreamRef.current) {
          console.error('MediaStream is null, cannot create MediaRecorder');
          return;
        }
        const stream: MediaStream = mediaStreamRef.current;
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          console.log('MediaRecorder data available:', e.data);
          console.log('MediaRecorder data size:', e.data.size);
        };
        recorder.start();
        setTimeout(() => {
          recorder.stop();
          console.log('MediaRecorder stopped after 3 seconds');
        }, 3000);
      };
      await testMic();

      mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      try {
        processorRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
        console.log('AudioWorkletNode created successfully');
      } catch (error) {
        console.error('Error creating AudioWorkletNode:', error);
        setRecordingStatus('Error: Failed to create AudioWorkletNode.');
        return false;
      }

      audioBufferRef.current = [];
      chunkNumberRef.current = 0;
      chunkStartTimeRef.current = Date.now();

      if (processorRef.current) {
        console.log('AudioWorkletNode port exists:', !!processorRef.current.port);

        processorRef.current.port.onmessage = (e: MessageEvent) => {
          if (!isRecordingLocal) return;

          if (e.data === 'test-message') {
            console.log('AudioWorkletNode received test message from processor:', e.data);
            return;
          }

          console.log('AudioWorkletNode message received, data type:', e.data.constructor.name);
          console.log('AudioWorkletNode message received, data length:', e.data.length);
          console.log('AudioWorkletNode message received, data sample (first 5):', e.data.slice(0, 5));
          const bufferCopy = new Float32Array(e.data);
          console.log('Buffer copy length:', bufferCopy.length);
          audioBufferRef.current.push(bufferCopy);

          const currentTime = Date.now();
          if (currentTime - chunkStartTimeRef.current >= CHUNK_DURATION_MS) {
            if (audioBufferRef.current.length > 0) {
              console.log('Sending audio chunk due to CHUNK_DURATION_MS reached');
              sendAudioChunk();
            }
            audioBufferRef.current = [];
            chunkStartTimeRef.current = currentTime;
          }
        };
        console.log('AudioWorkletNode onmessage handler set');

        processorRef.current.port.postMessage('test-message');
      } else {
        console.error('AudioWorkletNode creation failed');
        setRecordingStatus('Error: Failed to create AudioWorkletNode.');
        return false;
      }

      if (mediaStreamSourceRef.current && processorRef.current) {
        try {
          mediaStreamSourceRef.current.connect(processorRef.current);
          processorRef.current.connect(audioContextRef.current.destination);
          console.log('Audio pipeline connected: MediaStreamSource -> AudioWorkletNode -> Destination');

          const gainNode = audioContextRef.current.createGain();
          gainNode.gain.value = 1.5; // Increase gain to hear audio
          mediaStreamSourceRef.current.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);
          console.log('Temporary GainNode connected to hear audio');
        } catch (error) {
          console.error('Error connecting audio pipeline:', error);
          setRecordingStatus('Error: Failed to connect audio pipeline.');
          return false;
        }
      } else {
        console.error('MediaStreamSource or AudioWorkletNode is null');
        setRecordingStatus('Error: Audio setup incomplete.');
        return false;
      }

      isRecordingLocal = true;
      setIsRecording(true);
      console.log('startRecording: isRecordingLocal set to true, isRecording:', true);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Error starting recording: ${errorMessage}`);
      setRecordingStatus(`Error starting recording: ${errorMessage}`);
      cleanupAudio();
      return false;
    }
  };


  


  const startVADRecording = async () => {
    console.log('Starting VAD recording...');
    if (isRecording) {
      console.log('Recording is already in progress.');
      return;
    }
    if (vadCooldownRef.current) {
      console.log('VAD is in cooldown. Please wait.');
      setRecordingStatus('VAD cooldown active...');
      return;
    }

    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      setRecordingStatus('Error: WebSocket not connected. Attempting to connect...');
      initWebSocket();
      return;
    }

    setRecordingStatus('Initializing audio...');
    const success = await startRecording();
    if (success) {
      setIsRecording(true); // Trigger useEffect
    } else {
      setRecordingStatus('Error: Failed to initialize audio.');
    }
  };


  useEffect(() => {
    if (isRecording) {
      console.log('isRecording is true, calling setupVAD');
      setupVAD();
      setIsSpeaking(false);
      speechStartTimeRef.current = 0;
      silenceStartTimeRef.current = 0;
      audioBufferRef.current = [];
      setRecordingStatus('Listening for speech...');
      setTranscriptions([]);
    }
  }, [isRecording]);


  const setupVAD = () => {
    if (!audioContextRef.current || !mediaStreamSourceRef.current) {
      console.error('VAD: Audio context or media stream source not initialized.');
      setRecordingStatus('Error: VAD setup failed.');
      return;
    }
    vadAnalyserRef.current = audioContextRef.current.createAnalyser();
    vadAnalyserRef.current.fftSize = 256;
    try {
      mediaStreamSourceRef.current.connect(vadAnalyserRef.current);
      console.log('VAD: AnalyserNode connected successfully.');
    } catch (error) {
      console.error('VAD: Error connecting AnalyserNode:', error);
      setRecordingStatus('Error: VAD connection failed.');
    }
    monitorAudioLevel();
  };


  const monitorAudioLevel = () => {
    if (!isRecordingLocal || !vadAnalyserRef.current || !mediaStreamSourceRef.current) {
      console.log('VAD: Stopping monitorAudioLevel due to missing recording or VAD setup.');
      console.log(
        'VAD Debug: isRecordingLocal:',
        isRecordingLocal,
        'vadAnalyser:',
        !!vadAnalyserRef.current,
        'mediaStreamSource:',
        !!mediaStreamSourceRef.current
      );
      return;
    }

    console.log('VAD: monitorAudioLevel running');
    const vadDataArray = new Uint8Array(vadAnalyserRef.current.frequencyBinCount);
    vadAnalyserRef.current.getByteFrequencyData(vadDataArray);

    let sum = 0;
    for (let i = 0; i < vadDataArray.length; i++) {
      sum += vadDataArray[i];
    }
    const average = sum / vadDataArray.length / 255;
    console.log(`VAD: Audio level = ${average.toFixed(4)}, threshold = ${VAD_SETTINGS.silenceThreshold}`);

    const now = Date.now();

    if (average > VAD_SETTINGS.silenceThreshold) {
      if (!isSpeaking) {
        if (speechStartTimeRef.current === 0) {
          speechStartTimeRef.current = now;
        } else if (now - speechStartTimeRef.current >= VAD_SETTINGS.minSpeechDuration) {
          setIsSpeaking(true);
          silenceStartTimeRef.current = 0;
          setRecordingStatus('Speech detected, recording...');
          console.log('VAD: Speech confirmed, recording audio.');
          // ... rest of the VAD logic
        }
      } else {
        silenceStartTimeRef.current = 0;
      }
    } else {
      if (isSpeaking) {
        if (silenceStartTimeRef.current === 0) {
          silenceStartTimeRef.current = now;
        } else if (now - silenceStartTimeRef.current >= VAD_SETTINGS.minSilenceDuration) {
          console.log('VAD: Silence detected, stopping audio capture for this segment.');
          stopRecordingVAD('Silence detected');
        }
      } else {
        if (audioBufferRef.current.length > 0) {
          console.log('VAD: Clearing buffer from short utterance during silence.');
          audioBufferRef.current = [];
          chunkStartTimeRef.current = now;
        }
        if (speechStartTimeRef.current !== 0 && (now - speechStartTimeRef.current) > VAD_SETTINGS.minSilenceDuration) {
          speechStartTimeRef.current = 0;
        }
      }
    }

    if (isRecordingLocal) {
      requestAnimationFrame(monitorAudioLevel);
    }
  };

  



  const stopRecording = () => { // This is the main stop button action
    console.log('stopRecording: Attempting to stop recording...');
    console.log('stopRecording: isRecordingLocal:', isRecordingLocal, 'isRecording:', isRecording);

    if (!isRecordingLocal && !isRecording) {
      console.log('stopRecording: Not recording, exiting.');
      return;
    }

    isRecordingLocal = false;
    setIsRecording(false); // Stop main recording session
    console.log('stopRecording: User stopped main recording session.');

    if (activeRecordingTimeoutRef.current) {
      clearTimeout(activeRecordingTimeoutRef.current);
      activeRecordingTimeoutRef.current = null;
    }

    // If VAD was in a speaking state, ensure the last bit of audio is sent
    if (isSpeaking && audioBufferRef.current.length > 0) {
      console.log('stopRecording: Sending final audio chunk from active VAD speech.');
      sendAudioChunk();
    }
    setIsSpeaking(false); // Ensure speaking state is reset

    cleanupAudio(); // Disconnects ScriptProcessor, stops tracks, suspends AudioContext

    setRecordingStatus('Recording stopped');
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({ event: 'process_full_session' }));
      setTranscriptions((prev) => [
        ...prev,
        { translatedText: 'Processing full session... Please wait.', isLoading: true },
      ]);
    } else {
      setTranscriptions((prev) => [
        ...prev,
        { translatedText: 'Cannot process session: WebSocket is not connected.', isError: true },
      ]);
    }
  };



  const stopRecordingVAD = (reason: string) => {
    // This function is called by VAD when silence is detected or max duration is reached
    // It doesn't stop the main recording session (setIsRecording(false))
    // but rather stops capturing audio for the current speech segment.

    if (!isSpeaking) { // Only act if VAD thought we were speaking
      // console.log(`stopRecordingVAD called but not in a speaking state. Reason: ${reason}`);
      return;
    }

    console.log(`VAD: stopRecordingVAD called. Reason: ${reason}. Buffer length: ${audioBufferRef.current.length}`);

    if (activeRecordingTimeoutRef.current) {
      clearTimeout(activeRecordingTimeoutRef.current);
      activeRecordingTimeoutRef.current = null;
    }

    if (audioBufferRef.current.length > 0) {
      console.log('VAD: Sending final audio chunk for this speech segment.');
      sendAudioChunk(); // Send the collected audio
    }

    setIsSpeaking(false); // No longer actively capturing based on VAD
    audioBufferRef.current = []; // Clear buffer for the next speech detection
    speechStartTimeRef.current = 0; // Reset for next speech detection
    silenceStartTimeRef.current = 0; // Reset for next speech detection
    // Do not set recordingStatus here to "listening" yet, wait for cooldown.

    vadCooldownRef.current = true;
    setRecordingStatus(`Paused (${reason}). Listening soon...`);
    setTimeout(() => {
      vadCooldownRef.current = false;
      if (isRecordingLocal) { // Only go back to listening if main recording is still active
        setRecordingStatus('Listening for speech...');
      } else {
        setRecordingStatus('Recording stopped.');
      }
    }, VAD_SETTINGS.cooldownPeriod);
  };

  const cleanupAudio = () => {
    console.log('Cleaning up audio resources...');
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.port?.close();
      processorRef.current = null;
    }

    if (vadAnalyserRef.current && mediaStreamSourceRef.current) {
      try {
        mediaStreamSourceRef.current.disconnect(vadAnalyserRef.current);
      } catch (e) {
        console.warn('Error disconnecting VAD analyser:', e);
      }
      vadAnalyserRef.current = null;
    }

    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.suspend().then(() => {
        console.log('AudioContext suspended.');
      }).catch((e) => console.warn('Error suspending AudioContext:', e));
    }
  };

  const sendAudioChunk = () => {
    console.log('sendAudioChunk called, chunkNumber:', chunkNumberRef.current);
    if (!audioContextRef.current || !websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send audio: AudioContext not available or WebSocket not connected.');
      if (websocketRef.current?.readyState !== WebSocket.OPEN) {
        setTranscriptions((prev) => [
          ...prev,
          { translatedText: 'Error sending audio: WebSocket not connected.', isError: true },
        ]);
      }
      return;
    }
    if (audioBufferRef.current.length === 0) {
      console.log('No audio data in buffer to send for this chunk.');
      return;
    }

    try {
      let totalLength = 0;
      for (const buffer of audioBufferRef.current) {
        totalLength += buffer.length;
      }
      if (totalLength === 0) {
        console.log('No audio samples to send after concatenating.');
        return;
      }
      console.log('Sending audio chunk, total samples:', totalLength);

      const concatenatedBuffer = new Float32Array(totalLength);
      let offset = 0;
      for (const buffer of audioBufferRef.current) {
        concatenatedBuffer.set(buffer, offset);
        offset += buffer.length;
      }

      // Debug: Log a sample of the audio data being sent
      console.log('Audio data sample (first 5 samples):', concatenatedBuffer.slice(0, 5));

      const base64Data = arrayBufferToBase64(concatenatedBuffer.buffer);

      websocketRef.current.send(
        JSON.stringify({
          event: 'audio_chunk',
          chunkNumber: chunkNumberRef.current,
          audioData: base64Data,
          sampleRate: audioContextRef.current.sampleRate,
        })
      );
      console.log('Audio chunk sent, chunkNumber:', chunkNumberRef.current);
      chunkNumberRef.current++; // Increment for the next chunk in this speech segment
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error sending audio';
      console.error('Error sending audio:', errorMessage, error);
      setTranscriptions((prev) => [
        ...prev,
        { translatedText: `Error sending audio: ${errorMessage}`, isError: true },
      ]);
    }
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const binary = new Uint8Array(buffer);
    let base64 = '';
    const len = binary.byteLength;
    for (let i = 0; i < len; i++) {
      base64 += String.fromCharCode(binary[i]);
    }
    return btoa(base64);
  };

  // UI Rendering (remains largely the same)
  return (
    <div className={styles.container}>
      <h1>Voice Translation</h1>
      <div className={styles.controls}>
        <button
          onClick={startVADRecording}
          disabled={
            isRecording ||
            vadCooldownRef.current ||
            (websocketRef.current !== null && // Check for null explicitly
              websocketRef.current.readyState !== WebSocket.OPEN &&
              connectionStatus !== 'Connected')
          }
          className={styles.startButton}
          title={websocketRef.current && websocketRef.current.readyState !== WebSocket.OPEN && connectionStatus !== 'Connected' ? "Waiting for WebSocket connection" : "Start recording"}
        >
          Start Recording
        </button>
        <button
          onClick={stopRecording}
          disabled={!isRecording}
          className={styles.stopButton}
        >
          Stop Recording
        </button>
      </div>
      <div className={styles.statusRow}>
        <div
          className={`${styles.status} ${
            recordingStatus.includes('Error')
              ? styles.error
              : isRecording
              ? styles.active
              : styles.inactive
          }`}
        >
          {recordingStatus}
        </div>
        <div
          className={`${styles.status} ${
            connectionStatus === 'Connected' ? styles.active : styles.inactive
          } ${ connectionStatus === 'Error' ? styles.error : ''}`}
        >
          Socket: {connectionStatus}
        </div>
      </div>
      <h2>Translations</h2>
      <div className={styles.transcriptionContainer}>
        {transcriptions.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="material-icons">mic</i>
            <p>Click 'Start Recording' to begin voice recognition.</p>
            <p>Speak clearly. The system will automatically detect speech and pauses.</p>
            { (websocketRef.current && websocketRef.current.readyState !== WebSocket.OPEN && connectionStatus !== 'Connected') &&
                <p style={{color: 'orange'}}>Waiting for WebSocket to connect...</p>
            }
          </div>
        ) : (
          transcriptions.map((transcription, index) => (
            <div
              key={index}
              className={`${styles.transcriptionItem} ${
                transcription.isSummary ? styles.summary : ''
              } ${transcription.isLoading ? styles.systemMessage : ''} ${
                transcription.isError ? styles.errorMessage : ''
              }`}
            >
              {transcription.isSummary ? (
                <>
                  <div className={styles.summaryHeader}>Session Summary</div>
                  <div className={styles.translatedText}>{transcription.translatedText}</div>
                  {(transcription.originalText || transcription.translatedText) && ( // Check if there's anything to show
                    <>
                      <button
                        className={styles.expandButton}
                        onClick={() => setShowFullTranscription(!showFullTranscription)}
                      >
                        {showFullTranscription
                          ? 'Hide full transcription'
                          : 'Show full transcription'}
                      </button>
                      {showFullTranscription && (
                        <div className={styles.fullText}>
                          {transcription.originalText && !transcription.isEnglish && (
                            <div className={styles.originalText}>
                              <strong>Original:</strong> {transcription.originalText}
                            </div>
                          )}
                          <div className={styles.translatedText}>
                            {transcription.isEnglish && transcription.originalText ? transcription.originalText : transcription.translatedText}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  {transcription.originalText && !transcription.isEnglish && (
                    <div className={styles.originalText}>
                     <strong>Original:</strong> {transcription.originalText}
                    </div>
                  )}
                  <div className={styles.translatedText}>
                    {transcription.isEnglish && transcription.originalText ? transcription.originalText : transcription.translatedText}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveTranslation;