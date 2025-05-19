// AudioCapture.js
class AudioCapture {
    constructor(websocketUrl) {
      this.websocketUrl = websocketUrl;
      this.socket = null;
      this.audioStream = null;
      this.mediaRecorder = null;
      this.isRecording = false;
      this.chunkInterval = 3000; // Send chunks every 3 seconds
      this.chunkTimer = null;
      this.audioContext = null;
      this.analyser = null;
      this.dataArray = null;
      this.onAudioLevelUpdate = null; // Callback for audio level updates
      this.connect();
    }
  
    connect() {
      try {
        this.socket = new WebSocket(this.websocketUrl);
        
        this.socket.onopen = () => {
          console.log('WebSocket connected, ready to stream audio');
          this.registerSocketEvents();
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        this.socket.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          // Try to reconnect after 5 seconds if not intentionally closed
          if (this.isRecording) {
            setTimeout(() => this.connect(), 5000);
          }
        };
      } catch (error) {
        console.error('Error connecting to WebSocket server:', error);
      }
    }
  
    registerSocketEvents() {
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Server message:', data);
        } catch (e) {
          console.error('Error parsing server message:', e);
        }
      };
    }
  
    async startRecording() {
      if (this.isRecording || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
        return false;
      }
  
      try {
        // Request microphone access
        this.audioStream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          } 
        });
  
        // Set up audio context and analyser for visualization/verification
        this.setupAudioAnalyser();
  
        // Create media recorder for chunking the audio
        this.mediaRecorder = new MediaRecorder(this.audioStream, {
          mimeType: 'audio/webm',
          audioBitsPerSecond: 128000
        });
  
        // Handle data available event
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(event.data);
            console.log(`Audio chunk sent: ${Math.round(event.data.size / 1024)} KB`);
          }
        };
  
        // Start the recorder and request data at regular intervals
        this.mediaRecorder.start(this.chunkInterval);
        this.isRecording = true;
  
        // Start the audio level visualization
        this.startAudioLevelMonitoring();
  
        console.log('Audio recording started');
        return true;
      } catch (error) {
        console.error('Error starting audio recording:', error);
        return false;
      }
    }
  
    setupAudioAnalyser() {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.audioStream);
      
      // Create an analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);
      
      // Create a data array that will receive the analyser data
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }
  
    startAudioLevelMonitoring() {
      // Cancel any existing monitoring
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }
  
      const updateAudioLevel = () => {
        if (!this.isRecording || !this.analyser) {
          return;
        }
  
        // Get current audio data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Calculate average volume level (0-255)
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
          sum += this.dataArray[i];
        }
        const average = sum / this.dataArray.length;
        
        // Normalize to 0-100 for easier display
        const level = Math.round((average / 255) * 100);
        
        // Call the callback if defined
        if (typeof this.onAudioLevelUpdate === 'function') {
          this.onAudioLevelUpdate(level);
        }
        
        // Continue monitoring
        this.animationFrame = requestAnimationFrame(updateAudioLevel);
      };
      
      // Start the monitoring loop
      this.animationFrame = requestAnimationFrame(updateAudioLevel);
    }
  
    stopRecording() {
      if (!this.isRecording) {
        return;
      }
  
      // Stop media recorder
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
  
      // Stop all tracks on the stream
      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => track.stop());
      }
  
      // Stop audio visualization
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
  
      // Close audio context
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }
  
      this.analyser = null;
      this.dataArray = null;
      this.isRecording = false;
      
      console.log('Audio recording stopped');
    }
  
    disconnect() {
      this.stopRecording();
      
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
    }
  
    /**
     * Set a callback function to receive audio level updates (0-100)
     * This can be used for visual feedback to verify audio is being captured
     * @param {function} callback - Function to call with the audio level
     */
    setAudioLevelCallback(callback) {
      this.onAudioLevelUpdate = callback;
    }
  
    /**
     * Get the current recording state
     * @returns {boolean} - True if currently recording
     */
    getRecordingState() {
      return this.isRecording;
    }
  
    /**
     * Get connection state
     * @returns {number} - WebSocket ready state (0-3)
     */
    getConnectionState() {
      return this.socket ? this.socket.readyState : -1;
    }
  }
  
  export default AudioCapture;