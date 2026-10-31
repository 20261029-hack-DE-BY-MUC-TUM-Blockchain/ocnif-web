class OcnifAudioCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.samples = [];
    this.sum = 0;
    this.count = 0;
    this.phase = 0;
    this.ratio = sampleRate / 16000;
  }
  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;
    for (const sample of input) {
      this.sum += sample;
      this.count++;
      this.phase++;
      if (this.phase >= this.ratio) {
        this.samples.push(this.sum / this.count);
        this.sum = 0;
        this.count = 0;
        this.phase -= this.ratio;
      }
      if (this.samples.length >= 1024) {
        const chunk = new Float32Array(this.samples);
        this.port.postMessage(chunk, [chunk.buffer]);
        this.samples = [];
      }
    }
    return true;
  }
}
registerProcessor("ocnif-audio-capture", OcnifAudioCapture);
