import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import { createAudioStream, renderAudioBuffer } from "./audioTracks";

export type ExportFormat = "mp4" | "webm";

export interface RecordVideoOptions {
  format?: ExportFormat;
  /** Constant-frame-rate export FPS. MP4 defaults to 60 to match the smooth browser preview. */
  fps?: number;
  /** Procedural app audio track id. MP4 always muxes AAC; "none" creates silent AAC. */
  audioTrackId?: string;
}

interface Mp4ExportOptions {
  canvas: HTMLCanvasElement;
  totalMs: number;
  fps?: number;
  audioTrackId?: string;
  renderFrame: (frame: number, progress: number, totalFrames: number) => void;
  onProgress: (progress: number) => void;
}

interface WebMExportOptions extends Mp4ExportOptions {
  audioStream?: MediaStream;
}

const H264_CODECS = [
  "avc1.64002A", // High Profile, Level 4.2 for 1080p/60 social video.
  "avc1.640028", // High Profile, Level 4.0 fallback.
] as const;
const AAC_LC = "mp4a.40.2";

function getVideoBitrate(width: number, height: number, fps: number) {
  // Quality-targeted VBR approximation for CRF 18-20 visual quality in WebCodecs.
  const raw = width * height * fps * 0.12;
  return Math.round(Math.max(5_000_000, Math.min(raw, 28_000_000)));
}

function assertWebCodecsSupport() {
  if (!("VideoEncoder" in window) || !("VideoFrame" in window) || !("AudioEncoder" in window) || !("AudioData" in window)) {
    throw new Error("True MP4 export requires WebCodecs support in this browser. Try the latest Chrome or Edge.");
  }
}

async function configureVideoEncoder(
  muxer: Muxer<ArrayBufferTarget>,
  width: number,
  height: number,
  fps: number,
) {
  const baseConfig = {
    width,
    height,
    framerate: fps,
    bitrate: getVideoBitrate(width, height, fps),
    bitrateMode: "variable",
    latencyMode: "quality",
    hardwareAcceleration: "prefer-hardware",
    alpha: "discard",
    avc: { format: "avc" },
  } as Omit<VideoEncoderConfig, "codec">;

  for (const codec of H264_CODECS) {
    const config = { ...baseConfig, codec } as VideoEncoderConfig;
    const support = await VideoEncoder.isConfigSupported(config);
    if (!support.supported) continue;

    let rejectEncoder: (error: Error) => void = () => {};
    const errorPromise = new Promise<never>((_, reject) => {
      rejectEncoder = reject;
    });
    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (error) => rejectEncoder(error instanceof Error ? error : new Error(String(error))),
    });
    encoder.configure(support.config ?? config);
    return { encoder, errorPromise };
  }

  {
    throw new Error("This browser cannot encode H.264 High Profile MP4. Try the latest Chrome or Edge.");
  }
}

async function encodeAacAudio(
  muxer: Muxer<ArrayBufferTarget>,
  audioTrackId: string,
  totalMs: number,
) {
  const sampleRate = 44_100;
  const channels = 2;
  const audioBuffer = await renderAudioBuffer(audioTrackId, totalMs, sampleRate, channels);
  const config: AudioEncoderConfig = {
    codec: AAC_LC,
    sampleRate,
    numberOfChannels: channels,
    bitrate: 128_000,
  };

  const support = await AudioEncoder.isConfigSupported(config);
  if (!support.supported) {
    throw new Error("This browser cannot encode AAC audio for MP4 export. Try the latest Chrome or Edge.");
  }

  let rejectEncoder: (error: Error) => void = () => {};
  const errorPromise = new Promise<never>((_, reject) => {
    rejectEncoder = reject;
  });
  const encoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: (error) => rejectEncoder(error instanceof Error ? error : new Error(String(error))),
  });
  encoder.configure(support.config ?? config);

  const chunkFrames = 1024;
  const totalFrames = audioBuffer.length;
  for (let offset = 0; offset < totalFrames; offset += chunkFrames) {
    const frameCount = Math.min(chunkFrames, totalFrames - offset);
    const planar = new Float32Array(frameCount * channels);
    for (let channel = 0; channel < channels; channel++) {
      const samples = new Float32Array(frameCount);
      audioBuffer.copyFromChannel(samples, Math.min(channel, audioBuffer.numberOfChannels - 1), offset);
      planar.set(samples, channel * frameCount);
    }

    const audioData = new AudioData({
      format: "f32-planar",
      sampleRate,
      numberOfFrames: frameCount,
      numberOfChannels: channels,
      timestamp: Math.round((offset / sampleRate) * 1_000_000),
      data: planar,
    });
    encoder.encode(audioData);
    audioData.close();

    if (encoder.encodeQueueSize > 8) await new Promise((resolve) => setTimeout(resolve, 0));
  }

  await Promise.race([encoder.flush(), errorPromise]);
  encoder.close();
}

export async function encodeCanvasToMp4({
  canvas,
  totalMs,
  fps = 60,
  audioTrackId = "none",
  renderFrame,
  onProgress,
}: Mp4ExportOptions): Promise<Blob> {
  assertWebCodecsSupport();

  const width = canvas.width;
  const height = canvas.height;
  const totalFrames = Math.max(1, Math.round((totalMs / 1000) * fps));
  const frameDurationUs = Math.round(1_000_000 / fps);

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: "avc", width, height, frameRate: fps },
    audio: { codec: "aac", numberOfChannels: 2, sampleRate: 44_100 },
    fastStart: "in-memory",
    firstTimestampBehavior: "strict",
  });

  const { encoder, errorPromise } = await configureVideoEncoder(muxer, width, height, fps);

  for (let frame = 0; frame < totalFrames; frame++) {
    const progress = totalFrames === 1 ? 1 : frame / (totalFrames - 1);
    renderFrame(frame, progress, totalFrames);

    const videoFrame = new VideoFrame(canvas, {
      timestamp: frame * frameDurationUs,
      duration: frameDurationUs,
    });
    encoder.encode(videoFrame, { keyFrame: frame % Math.max(1, Math.round(fps * 2)) === 0 });
    videoFrame.close();

    onProgress(Math.min(0.9, (frame + 1) / totalFrames * 0.9));
    if (encoder.encodeQueueSize > 8) await new Promise((resolve) => setTimeout(resolve, 0));
  }

  await Promise.race([encoder.flush(), errorPromise]);
  encoder.close();
  onProgress(0.92);

  await encodeAacAudio(muxer, audioTrackId, totalMs);
  onProgress(0.98);

  muxer.finalize();
  onProgress(1);

  return new Blob([target.buffer], { type: "video/mp4" });
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function encodeCanvasToWebM({
  canvas,
  totalMs,
  fps = 60,
  audioTrackId = "none",
  audioStream,
  renderFrame,
  onProgress,
}: WebMExportOptions): Promise<Blob> {
  const totalFrames = Math.max(1, Math.round((totalMs / 1000) * fps));
  const frameDuration = 1000 / fps;
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm;codecs=vp8";

  const generatedAudio = audioStream ? null : createAudioStream(audioTrackId, totalMs);
  const stream = canvas.captureStream(fps);
  (audioStream ?? generatedAudio?.stream)?.getAudioTracks().forEach((track) => stream.addTrack(track));

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: getVideoBitrate(canvas.width, canvas.height, fps),
    audioBitsPerSecond: 128_000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  return new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error("WebM recording failed"));
    recorder.onstop = () => {
      generatedAudio?.stop();
      stream.getTracks().forEach((track) => track.stop());
      resolve(new Blob(chunks, { type: mimeType }));
    };

    recorder.start(250);
    const track = stream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void };

    (async () => {
      try {
        for (let frame = 0; frame < totalFrames; frame++) {
          const progress = totalFrames === 1 ? 1 : frame / (totalFrames - 1);
          renderFrame(frame, progress, totalFrames);
          track.requestFrame?.();
          onProgress(progress);
          if (frame < totalFrames - 1) await wait(frameDuration);
        }
        await wait(300);
        recorder.stop();
      } catch (error) {
        generatedAudio?.stop();
        reject(error instanceof Error ? error : new Error("WebM recording failed"));
      }
    })();
  });
}