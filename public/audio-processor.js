//@ts-nocheck

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    console.log('AudioWorkletProcessor: Constructor called');
    this.port.onmessage = (e) => {
      console.log('AudioWorkletProcessor: Received message from main thread:', e.data);
    };
  }

  process(inputs, outputs, parameters) {
    console.log('AudioWorkletProcessor: Processing inputs, length:', inputs.length);
    const input = inputs[0];
    if (input && input.length > 0) {
      const inputData = input[0];
      console.log('AudioWorkletProcessor: Input data length:', inputData.length);
      console.log('AudioWorkletProcessor: Input data sample (first 5):', inputData.slice(0, 5));
      this.port.postMessage(inputData);
      console.log('AudioWorkletProcessor: Data sent via port.postMessage');
    } else {
      console.log('AudioWorkletProcessor: No input data available');
    }
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);