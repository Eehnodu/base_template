// 마이크 입력(브라우저 기본 샘플레이트, float32)을 24kHz · 16-bit PCM(mono)으로 바꿔 메인 스레드로 보낸다.
// useAudioWs.ts 가 audioWorklet.addModule("/audio/resamplePcmProcessor.js") 로 불러온다.

const TARGET_RATE = 24000;
const CHUNK_SAMPLES = 2400; // 100ms 단위로 모아서 보낸다

class ResamplePcmProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / TARGET_RATE; // sampleRate: 워크릿 전역 (예: 48000)
    this.pos = 0; // 입력 기준 다음 출력 샘플 위치
    this.prev = 0; // 직전 블록의 마지막 샘플 (보간용)
    this.out = new Int16Array(CHUNK_SAMPLES);
    this.outLen = 0;
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel || channel.length === 0) return true;

    // 직전 샘플을 앞에 붙여 블록 경계에서도 선형 보간이 끊기지 않게 한다
    const len = channel.length;
    while (this.pos < len) {
      const i = Math.floor(this.pos);
      const frac = this.pos - i;
      const a = i === 0 ? this.prev : channel[i - 1];
      const b = channel[i];
      const v = a + (b - a) * frac;

      const s = Math.max(-1, Math.min(1, v));
      this.out[this.outLen++] = s < 0 ? s * 0x8000 : s * 0x7fff;

      if (this.outLen === CHUNK_SAMPLES) {
        this.port.postMessage(this.out.buffer, [this.out.buffer]);
        this.out = new Int16Array(CHUNK_SAMPLES);
        this.outLen = 0;
      }
      this.pos += this.ratio;
    }

    this.pos -= len;
    this.prev = channel[len - 1];
    return true;
  }
}

registerProcessor("resample-pcm-processor", ResamplePcmProcessor);
