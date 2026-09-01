// 역할: 브라우저 전용 전역 타입 보강 (Web Speech API)
/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  // 브라우저에 존재할 수 있는 전역 객체들
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }

  var webkitSpeechRecognition: any;
  var SpeechRecognition: any;
}

export {};
