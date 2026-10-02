import { PetAvatar, PetEmotion, PetStyle, StylizeParams } from '../types';

export class StylizeService {
  /**
   * Process uploaded image using offline Canvas algorithms (Cel-shading, Edge contours, Background alpha removal)
   */
  public static async processOfflineStylize(
    imgSource: string,
    params: StylizeParams
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const maxDim = 400;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(imgSource);
            return;
          }

          // Draw initial image
          ctx.drawImage(img, 0, 0, width, height);

          // Pixel manipulation
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;

          // 1. Detect background color from corners if removeBackground is enabled
          const cornerColors = [
            [data[0], data[1], data[2]], // Top-left
            [data[(width - 1) * 4], data[(width - 1) * 4 + 1], data[(width - 1) * 4 + 2]], // Top-right
            [data[(height - 1) * width * 4], data[(height - 1) * width * 4 + 1], data[(height - 1) * width * 4 + 2]] // Bottom-left
          ];
          const bgR = (cornerColors[0][0] + cornerColors[1][0] + cornerColors[2][0]) / 3;
          const bgG = (cornerColors[0][1] + cornerColors[1][1] + cornerColors[2][1]) / 3;
          const bgB = (cornerColors[0][2] + cornerColors[1][2] + cornerColors[2][2]) / 3;

          const cartoonSteps = Math.max(3, Math.min(12, 14 - params.cartoonLevel));
          const stepSize = 255 / cartoonSteps;

          for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            let a = data[i + 3];

            if (a < 20) continue;

            // Background removal: check distance to background color
            if (params.removeBackground) {
              const colorDist = Math.sqrt(
                Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
              );
              // Check if light background (like white/grey photo background)
              const isVeryBright = r > 230 && g > 230 && b > 230;
              if (colorDist < 45 || isVeryBright) {
                data[i + 3] = 0;
                continue;
              }
            }

            // Cel-Shading: Quantize colors into discrete anime bands
            r = Math.floor(r / stepSize) * stepSize;
            g = Math.floor(g / stepSize) * stepSize;
            b = Math.floor(b / stepSize) * stepSize;

            // Vibrancy / Saturation boost (essential for vibrant anime style)
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const avg = (r + g + b) / 3;
            const boost = 1 + (params.vibrancy / 10) * 0.6;

            r = Math.min(255, Math.max(0, avg + (r - avg) * boost));
            g = Math.min(255, Math.max(0, avg + (g - avg) * boost));
            b = Math.min(255, Math.max(0, avg + (b - avg) * boost));

            // Style palette tuning
            if (params.style === 'cyberpunk') {
              // Boost cyan and magenta
              r = Math.min(255, r * 1.15 + 15);
              b = Math.min(255, b * 1.3 + 30);
            } else if (params.style === 'ghibli') {
              // Warm tones, soft greens and creams
              r = Math.min(255, r * 1.05 + 10);
              g = Math.min(255, g * 1.08 + 8);
            } else if (params.style === 'pixel') {
              // Hard retro step
              r = Math.round(r / 32) * 32;
              g = Math.round(g / 32) * 32;
              b = Math.round(b / 32) * 32;
            }

            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
          }

          ctx.putImageData(imgData, 0, 0);

          // Apply anime stroke outline (sobel edge overlay)
          if (params.edgeStrength > 0) {
            const edgeCanvas = document.createElement('canvas');
            edgeCanvas.width = width;
            edgeCanvas.height = height;
            const edgeCtx = edgeCanvas.getContext('2d');
            if (edgeCtx) {
              edgeCtx.drawImage(canvas, 0, 0);
              const edgeImgData = edgeCtx.getImageData(0, 0, width, height);
              const edgeData = edgeImgData.data;

              // Sobel edge filter
              const gray = new Float32Array(width * height);
              for (let i = 0; i < width * height; i++) {
                gray[i] =
                  0.299 * data[i * 4] +
                  0.587 * data[i * 4 + 1] +
                  0.114 * data[i * 4 + 2];
              }

              const edgeThreshold = 35 - params.edgeStrength * 2.5;
              for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                  const idx = (y * width + x) * 4;
                  if (data[idx + 3] === 0) continue;

                  // Horizontal gradient
                  const gx =
                    -gray[(y - 1) * width + (x - 1)] +
                    gray[(y - 1) * width + (x + 1)] -
                    2 * gray[y * width + (x - 1)] +
                    2 * gray[y * width + (x + 1)] -
                    gray[(y + 1) * width + (x - 1)] +
                    gray[(y + 1) * width + (x + 1)];

                  // Vertical gradient
                  const gy =
                    -gray[(y - 1) * width + (x - 1)] -
                    2 * gray[(y - 1) * width + x] -
                    gray[(y - 1) * width + (x + 1)] +
                    gray[(y + 1) * width + (x - 1)] +
                    2 * gray[(y + 1) * width + x] +
                    gray[(y + 1) * width + (x + 1)];

                  const mag = Math.sqrt(gx * gx + gy * gy);
                  if (mag > edgeThreshold) {
                    // Dark anime contour line
                    data[idx] = Math.max(0, data[idx] * 0.25);
                    data[idx + 1] = Math.max(0, data[idx + 1] * 0.25);
                    data[idx + 2] = Math.max(0, data[idx + 2] * 0.25);
                  }
                }
              }
              ctx.putImageData(imgData, 0, 0);
            }
          }

          resolve(canvas.toDataURL('image/png'));
        } catch (err) {
          console.error('Stylize error:', err);
          resolve(imgSource);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image source'));
      img.src = imgSource;
    });
  }

  /**
   * Cloud AI Image Generation / Stylization using SiliconFlow, OpenAI, or Gemini
   */
  public static async processCloudAIStylize(
    apiKey: string,
    baseUrl: string,
    prompt: string,
    style: PetStyle,
    sourceBase64?: string
  ): Promise<string> {
    const styleDescriptions: Record<PetStyle, string> = {
      anime: 'high quality anime illustration, Kyoto Animation style, vibrant cel shading, cute desktop mascot, clean transparent background, masterwork sticker',
      cartoon: 'Pixar 3D animated character style, smooth cute rendering, vibrant expressive lighting, soft rim light, clean transparent background, 3D mascot',
      pixel: '16-bit retro arcade pixel art sprite, Japanese RPG companion pet, crisp pixel outlines, transparent background',
      cyberpunk: 'cyberpunk anime companion, glowing neon accents, futuristic cybernetic details, holographic aesthetics, isolated on transparent background',
      ghibli: 'Studio Ghibli hand-drawn watercolor aesthetic, lush warm colors, nostalgic whimsical companion creature, transparent background',
      chibi: 'super cute chibi kawaii character, oversized head, tiny body, big sparkly eyes, cute anime sticker, isolated transparent background'
    };

    const finalPrompt = `Cute pet mascot avatar: ${prompt}. ${styleDescriptions[style]}. Highly detailed, isolated character sprite, stickers, clean edges, transparent background, png format, no text, no watermark.`;

    // Try OpenAI or SiliconFlow Image API
    const targetUrl = baseUrl.includes('/v1')
      ? `${baseUrl}/images/generations`
      : `${baseUrl}/v1/images/generations`;

    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          model: baseUrl.includes('siliconflow')
            ? 'black-forest-labs/FLUX.1-schnell'
            : 'dall-e-3',
          n: 1,
          size: '1024x1024',
          response_format: 'b64_json'
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`AI Image Generation failed (${res.status}): ${errText}`);
      }

      const json = await res.json();
      if (json.data && json.data[0]) {
        if (json.data[0].b64_json) {
          return `data:image/png;base64,${json.data[0].b64_json}`;
        }
        if (json.data[0].url) {
          return json.data[0].url;
        }
      }
      throw new Error('No image data received from API');
    } catch (err: unknown) {
      console.warn('Cloud AI failed, falling back to local stylization:', err);
      throw err;
    }
  }

  /**
   * Generate emotion variations for a custom pet image by applying facial overlays
   */
  public static async generateEmotionSprites(
    baseImageUri: string
  ): Promise<Record<PetEmotion, string>> {
    const emotions: PetEmotion[] = ['idle', 'happy', 'thinking', 'surprised', 'sleeping', 'celebrating', 'alert'];
    const result: Record<string, string> = { idle: baseImageUri };

    // Create canvas to overlay cute emotion indicators
    const img = new Image();
    img.src = baseImageUri;
    await new Promise((res) => { img.onload = res; img.onerror = res; });

    const w = img.width || 200;
    const h = img.height || 220;

    for (const em of emotions) {
      if (em === 'idle') continue;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        result[em] = baseImageUri;
        continue;
      }

      // Draw base
      ctx.drawImage(img, 0, 0, w, h);

      // Add emotion markers
      if (em === 'happy') {
        // Pink blush circles
        ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
        ctx.beginPath();
        ctx.arc(w * 0.35, h * 0.58, w * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w * 0.65, h * 0.58, w * 0.08, 0, Math.PI * 2);
        ctx.fill();
        // Sparkle
        ctx.fillStyle = '#fbbf24';
        ctx.font = `bold ${Math.round(w * 0.16)}px Outfit, sans-serif`;
        ctx.fillText('✨', w * 0.72, h * 0.3);
      } else if (em === 'thinking') {
        ctx.fillStyle = '#38bdf8';
        ctx.font = `900 ${Math.round(w * 0.18)}px Outfit, sans-serif`;
        ctx.fillText('?', w * 0.75, h * 0.3);
      } else if (em === 'surprised' || em === 'alert') {
        ctx.fillStyle = '#f59e0b';
        ctx.font = `900 ${Math.round(w * 0.22)}px Outfit, sans-serif`;
        ctx.fillText('!', w * 0.78, h * 0.3);
      } else if (em === 'sleeping') {
        ctx.fillStyle = '#a855f7';
        ctx.font = `bold ${Math.round(w * 0.16)}px Outfit, sans-serif`;
        ctx.fillText('zZ', w * 0.72, h * 0.35);
      } else if (em === 'celebrating') {
        ctx.fillStyle = '#ec4899';
        ctx.font = `bold ${Math.round(w * 0.18)}px Outfit, sans-serif`;
        ctx.fillText('🎉', w * 0.72, h * 0.28);
      }

      result[em] = canvas.toDataURL('image/png');
    }

    return result as Record<PetEmotion, string>;
  }
}
