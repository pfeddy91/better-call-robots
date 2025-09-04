/**
 * Type declarations for the wavefile library
 * 
 * This file provides TypeScript types for the wavefile library
 * which doesn't have official @types package.
 */
declare module 'wavefile' {
  interface WaveFileFormat {
    audioFormat: number;
    sampleRate: number;
    bitsPerSample: number;
    numChannels: number;
  }

  interface WaveFileData {
    samples: Uint8Array | Int16Array | Float32Array;
  }

  export class WaveFile {
    constructor();
    
    // Properties with proper typing
    fmt: WaveFileFormat;
    data: WaveFileData;
    
    // Methods
    fromScratch(
      numChannels: number,
      sampleRate: number,
      bitDepth: string,
      samples: Uint8Array | Int16Array | Float32Array | ArrayBuffer,
      options?: {
        container?: string;
        chunkSize?: string | number;
        bitDepth?: string;
        sampleRate?: number;
        numChannels?: number;
        audioFormat?: number;
      }
    ): void;
    
    fromBuffer(buffer: Buffer | Uint8Array): void;
    
    toBitDepth(bitDepth: string): void;
    
    toSampleRate(sampleRate: number): void;
    
    toMuLaw(): void;
    
    getSamples(interleaved?: boolean, type?: any): Float64Array | Int16Array | Uint8Array;
  }
} 