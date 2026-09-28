import { useRef } from "react";
import { baseURL } from "./useAPI";

type Mode = "realtime" | "legacy";

interface AudioWsProps {
  mode?: Mode;
  onConnect?: (sessionId: string) => void;
  onDisconnect?: () => void;
  onSttText?: (text: string, isPartial?: boolean) => void;
  onGptText?: (text: string, isPartial?: boolean) => void;
  onTtsStart?: () => void;
  onTtsEnd?: () => void;
  onChatText?: (text: string) => void;
}

// WebSocket의 OPEN 상태
const WS_OPEN = 1;

export const useAudioWs = (props: AudioWsProps = {}) => {
  const { mode = "realtime" } = props;
  // 실제 WebSocket 인스턴스를 보관하는 ref
  const wsRef = useRef<WebSocket | null>(null);
  // 서버와 공유하는 session id (config/send/disconnect에서 사용)
  const sessionIdRef = useRef<string | null>(null);
  // 마이크 캡처 및 오디오 처리를 위한 것들
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  // 재생용 AudioContext (realtime PCM 재생용)
  const playbackCtxRef = useRef<AudioContext | null>(null);
  // legacy 모드에서 <audio> 인스턴스 저장용
  const legacyAudioRef = useRef<HTMLAudioElement | null>(null);

  // WebSocket 서버에 연결하는 함수
  const connect = async (chatbot_id: number = 1) => {
    if (wsRef.current && wsRef.current.readyState === WS_OPEN) return;

    const wsUrl = baseURL.replace(/^http/, "ws") + "/api/ws/";
    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;

    const ws = new WebSocket(wsUrl);
    ws.binaryType = "blob";
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "config",
          session_id: sessionId,
          sampleRate: 24000,
          clientSampleRate: 24000,
          mode,
          chatbot_id: chatbot_id,
        })
      );
      props.onConnect?.(sessionId);
    };

    ws.onmessage = (e) => {
      // 텍스트 프레임 처리
      if (typeof e.data === "string") {
        try {
          const msg = JSON.parse(e.data);
          switch (msg.type) {
            case "stt_text":
              props.onSttText?.(msg.text ?? "", msg.partial);
              break;
            case "gpt_text":
              props.onGptText?.(msg.text ?? "", msg.partial);
              break;
            default:
              console.log("WS text msg:", msg);
          }
        } catch {
          console.log("WS nonJSON:", e.data);
        }
        return;
      }

      // 바이너리 프레임 (TTS 오디오)
      const blob = e.data as Blob;
      props.onTtsStart?.();

      if (mode === "realtime") {
        // Realtime: PCM16(24kHz) → Web Audio 재생
        blob
          .arrayBuffer()
          .then((buf) => playPcm16(buf))
          .then(() => {
            props.onTtsEnd?.();
          })
          .catch((err) => {
            console.error("audio play error (realtime):", err);
            props.onTtsEnd?.();
          });
      } else {
        // Legacy: MP3 → <audio> 재생
        // 기존에 재생 중이던 게 있으면 먼저 정리
        if (legacyAudioRef.current) {
          legacyAudioRef.current.pause();
          legacyAudioRef.current.currentTime = 0;
          legacyAudioRef.current = null;
        }

        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        legacyAudioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          if (legacyAudioRef.current === audio) {
            legacyAudioRef.current = null;
          }
          props.onTtsEnd?.();
        };

        audio.onerror = (err) => {
          console.error("audio play error (legacy):", err);
          URL.revokeObjectURL(url);
          if (legacyAudioRef.current === audio) {
            legacyAudioRef.current = null;
          }
          props.onTtsEnd?.();
        };

        audio.play().catch((err) => {
          console.error("audio play error (legacy play):", err);
          URL.revokeObjectURL(url);
          if (legacyAudioRef.current === audio) {
            legacyAudioRef.current = null;
          }
          props.onTtsEnd?.();
        });
      }
    };

    ws.onerror = (err) => {
      console.error("WS error:", err);
    };

    ws.onclose = () => {
      // 소켓이 끊길 때 재생 중 오디오들도 정리
      stopPlaybackImmediately();
      props.onDisconnect?.();
      wsRef.current = null;
    };
  };

  /**
   * 마이크 캡처 시작
   */
  const startMic = async () => {
    if (mediaStreamRef.current) return;

    const ctx = audioContextRef.current || new AudioContext();
    audioContextRef.current = ctx;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true,
      },
    });
    mediaStreamRef.current = stream;

    try {
      await ctx.audioWorklet.addModule("/audio/resamplePcmProcessor.js");
    } catch (err) {
      console.error("audioWorklet.addModule 실패", err);
      throw err;
    }

    const workletNode = new AudioWorkletNode(ctx, "resample-pcm-processor");
    workletNodeRef.current = workletNode;

    const source = ctx.createMediaStreamSource(stream);
    source.connect(workletNode);

    workletNode.port.onmessage = (event) => {
      if (wsRef.current?.readyState === WS_OPEN) {
        wsRef.current.send(event.data);
      }
    };
  };

  /**
   * 마이크 캡처 중지
   */
  const stopMic = async () => {
    try {
      workletNodeRef.current?.disconnect();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      await audioContextRef.current?.suspend();
    } catch (error) {
      // 무시
      console.warn(error)
    } finally {
      workletNodeRef.current = null;
      mediaStreamRef.current = null;
    }
  };

  /**
   * 외부에서 사용할 공통 API: 녹음 시작
   */
  const startRecording = async () => {
    await startMic();
  };

  /**
   * 외부에서 사용할 공통 API: 녹음 종료
   * - legacy 모드: stopMic 후 서버에 send(commit) 전송
   * - realtime 모드: stopMic만 하고, 나머지는 Realtime API가 처리
   */
  const stopRecording = async () => {
    await stopMic();

    if (mode === "legacy" && wsRef.current?.readyState === WS_OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "send",
          session_id: sessionIdRef.current,
        })
      );
    }
  };

  /**
   * 재생 중인 오디오를 모두 즉시 끊는 함수
   * - realtime: playback AudioContext close
   * - legacy: <audio> pause
   */
  const stopPlaybackImmediately = () => {
    // legacy: HTMLAudio 정지
    if (legacyAudioRef.current) {
      try {
        legacyAudioRef.current.pause();
        legacyAudioRef.current.currentTime = 0;
      } catch {
        // 무시
      } finally {
        legacyAudioRef.current = null;
      }
    }

    // realtime: playback AudioContext 정리
    if (playbackCtxRef.current) {
      try {
        playbackCtxRef.current.close();
      } catch {
        // 무시
      } finally {
        playbackCtxRef.current = null;
      }
    }
  };

  // 전체 WebSocket 세션 종료
  const disconnect = async () => {
    try {
      // 재생 중인 음성 먼저 끊기
      stopPlaybackImmediately();

      // 마이크/입력 쪽 정리
      await stopMic();
      await audioContextRef.current?.close();

      // 서버에 disconnect 알림 + 소켓 닫기
      if (wsRef.current?.readyState === WS_OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "disconnect",
            session_id: sessionIdRef.current,
          })
        );
      }
      wsRef.current?.close();
    } finally {
      audioContextRef.current = null;
      wsRef.current = null;
      sessionIdRef.current = null;
    }
  };

  const sendChat = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    if (wsRef.current?.readyState !== WS_OPEN) return;

    const sessionId = sessionIdRef.current;
    if (!sessionId) return;

    wsRef.current.send(
      JSON.stringify({
        type: "chat",
        session_id: sessionId,
        text: t,
        mode,
      })
    );
  };

  // 서버에서 온 PCM16(24kHz) 버퍼 재생 (realtime)
  const playPcm16 = async (buf: ArrayBuffer) => {
    if (!playbackCtxRef.current) {
      playbackCtxRef.current = new AudioContext({ sampleRate: 24000 });
    }
    const ctx = playbackCtxRef.current;

    const int16 = new Int16Array(buf);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      let v = int16[i] / 0x8000;
      if (v > 1) v = 1;
      if (v < -1) v = -1;
      float32[i] = v;
    }

    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const src = ctx.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(ctx.destination);
    src.start();
  };

  return {
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendChat,
    getSessionId: () => sessionIdRef.current,
  };
};
