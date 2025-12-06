import { GoogleGenAI, Modality } from "@google/genai";
import { decodeBase64, decodeAudioData, audioBufferToWav } from "./audioUtils";

// Initialize Gemini Client
// NOTE: Process.env.API_KEY is handled by the build environment/runtime.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface SynthesisResult {
  audioBuffer: AudioBuffer;
  blob: Blob;
}

export const generateSpeech = async (
  text: string,
  voiceName: string,
  audioContext: AudioContext
): Promise<SynthesisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [
        {
          parts: [{ text: text }],
        },
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data received from Gemini.");
    }

    const audioBytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
    const blob = audioBufferToWav(audioBuffer);

    return { audioBuffer, blob };

  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
};
