// Studio and CLI defaults. Node.js APIs ignore this file — pass options there.
// All options: https://remotion.dev/docs/config

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setStudioPort(3100);
Config.setOverwriteOutput(true);

// Three.js (Canvas3D) needs WebGL in headless Chrome.
Config.setChromiumOpenGlRenderer("angle");

// Masters: H.264, crf 16, slow preset, BT.709, AAC 320k.
// Frames as JPEG q95: grain covers the gradients, no banding (checked on stills).
Config.setCodec("h264");
Config.setCrf(16);
Config.setX264Preset("slow");
Config.setColorSpace("bt709");
Config.setPixelFormat("yuv420p");
Config.setAudioBitrate("320k");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setStillImageFormat("png");
