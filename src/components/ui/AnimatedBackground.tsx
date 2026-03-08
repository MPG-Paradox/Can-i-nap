'use client';

import React, { useEffect, useRef, memo } from 'react';

const AnimatedBackground = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Skip if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Skip if no WebGL
    const testCanvas = document.createElement('canvas');
    const gl =
      testCanvas.getContext('webgl') ||
      testCanvas.getContext('experimental-webgl');
    if (!gl) return;

    let cleanup: (() => void) | null = null;

    // Dynamic import Three.js — doesn't block initial page load
    import('three').then((THREE) => {
      // Guard: container may have unmounted during async import
      if (!containerRef.current) return;

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
      const renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(renderer.domElement);

      const material = new THREE.ShaderMaterial({
        uniforms: {
          iTime: { value: 0 },
          iResolution: {
            value: new THREE.Vector2(
              window.innerWidth * pixelRatio,
              window.innerHeight * pixelRatio
            ),
          },
        },
        vertexShader: `
          void main() {
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float iTime;
          uniform vec2 iResolution;

          #define NUM_OCTAVES 3

          float rand(vec2 n) {
            return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
          }

          float noise(vec2 p) {
            vec2 ip = floor(p);
            vec2 u = fract(p);
            u = u * u * (3.0 - 2.0 * u);
            float res = mix(
              mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
              mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
            return res * res;
          }

          float fbm(vec2 x) {
            float v = 0.0;
            float a = 0.3;
            vec2 shift = vec2(100);
            mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
            for (int i = 0; i < NUM_OCTAVES; ++i) {
              v += a * noise(x);
              x = rot * x * 2.0 + shift;
              a *= 0.4;
            }
            return v;
          }

          void main() {
            vec2 p = (gl_FragCoord.xy - iResolution.xy * 0.5) / iResolution.y * mat2(6.0, -4.0, 4.0, 6.0);
            vec4 o = vec4(0.0);
            float f = 2.0 + fbm(p + vec2(iTime * 3.0, 0.0)) * 0.5;

            for (float i = 0.0; i < 20.0; i++) {
              vec2 v = p + cos(i * i + (iTime + p.x * 0.08) * 0.02 + i * vec2(13.0, 11.0)) * 3.5;

              // Deep indigo/navy aurora — matches app theme
              vec4 auroraColors = vec4(
                0.02 + 0.08 * sin(i * 0.2 + iTime * 0.3),
                0.05 + 0.12 * cos(i * 0.3 + iTime * 0.4),
                0.15 + 0.15 * sin(i * 0.4 + iTime * 0.25),
                1.0
              );

              float thinnessFactor = smoothstep(0.0, 1.0, i / 20.0) * 0.5;
              o += auroraColors * exp(sin(i * i + iTime * 0.6))
                   / length(max(v, vec2(v.x * f * 0.015, v.y * 1.5)))
                   * thinnessFactor;
            }

            o = tanh(pow(o / 80.0, vec4(1.6)));
            gl_FragColor = o * 0.6;
          }
        `,
      });

      const geometry = new THREE.PlaneGeometry(2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      let frameId: number;
      let lastTime = 0;
      const frameInterval = 1000 / 30; // 30fps cap

      const animate = (time: number) => {
        frameId = requestAnimationFrame(animate);
        const delta = time - lastTime;
        if (delta < frameInterval) return;
        lastTime = time - (delta % frameInterval);
        material.uniforms.iTime.value += 0.016;
        renderer.render(scene, camera);
      };
      requestAnimationFrame(animate);

      const handleResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        material.uniforms.iResolution.value.set(
          window.innerWidth * pixelRatio,
          window.innerHeight * pixelRatio
        );
      };
      window.addEventListener('resize', handleResize);

      cleanup = () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('resize', handleResize);
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
});

AnimatedBackground.displayName = 'AnimatedBackground';
export default AnimatedBackground;
