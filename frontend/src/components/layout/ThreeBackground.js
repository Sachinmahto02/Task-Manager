import { useEffect, useRef } from 'react';

const ThreeBackground = () => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', { alpha: true }) || canvas.getContext('experimental-webgl', { alpha: true });

    if (!gl) {
      // Fallback: CSS gradient background
      document.body.style.background = 'radial-gradient(ellipse at 20% 50%, #1a0533 0%, #080612 50%), radial-gradient(ellipse at 80% 20%, #061a2e 0%, transparent 50%)';
      return;
    }

    let width, height;
    const particles = [];
    const PARTICLE_COUNT = 180;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      gl.viewport(0, 0, width, height);
    };

    window.addEventListener('resize', resize);
    resize();

    // Initialize particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.0004,
        vy: (Math.random() - 0.5) * 0.0004,
        size: Math.random() * 2.5 + 0.5,
        type: Math.floor(Math.random() * 3), // 0=purple, 1=cyan, 2=white
        phase: Math.random() * Math.PI * 2
      });
    }

    const vsSource = `
      attribute vec2 aPosition;
      attribute float aSize;
      attribute float aAlpha;
      attribute float aType;
      varying float vAlpha;
      varying float vType;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
        gl_PointSize = aSize;
        vAlpha = aAlpha;
        vType = aType;
      }
    `;

    const fsSource = `
      precision mediump float;
      varying float vAlpha;
      varying float vType;
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;
        float alpha = (1.0 - dist * 2.0) * vAlpha;
        vec3 color;
        if (vType < 0.5) {
          color = vec3(0.545, 0.361, 0.965); // purple
        } else if (vType < 1.5) {
          color = vec3(0.024, 0.714, 0.831); // cyan
        } else {
          color = vec3(0.8, 0.75, 1.0); // light lavender
        }
        gl_FragColor = vec4(color, alpha);
      }
    `;

    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    const posBuffer = gl.createBuffer();
    const sizeBuffer = gl.createBuffer();
    const alphaBuffer = gl.createBuffer();
    const typeBuffer = gl.createBuffer();

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    let time = 0;

    const render = () => {
      time += 0.008;
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const positions = new Float32Array(PARTICLE_COUNT * 2);
      const sizes = new Float32Array(PARTICLE_COUNT);
      const alphas = new Float32Array(PARTICLE_COUNT);
      const types = new Float32Array(PARTICLE_COUNT);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x > 1.2) p.x = -1.2;
        if (p.x < -1.2) p.x = 1.2;
        if (p.y > 1.2) p.y = -1.2;
        if (p.y < -1.2) p.y = 1.2;

        // Subtle drift
        p.x += Math.sin(time * 0.3 + p.phase) * 0.00015;
        p.y += Math.cos(time * 0.2 + p.phase) * 0.00015;

        positions[i * 2] = p.x;
        positions[i * 2 + 1] = p.y;
        sizes[i] = p.size * (1 + 0.3 * Math.sin(time + p.phase));
        alphas[i] = 0.3 + 0.5 * Math.abs(Math.sin(time * 0.5 + p.phase));
        types[i] = p.type;
      }

      const setAttr = (buffer, data, name, size) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
        const loc = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      };

      setAttr(posBuffer, positions, 'aPosition', 2);
      setAttr(sizeBuffer, sizes, 'aSize', 1);
      setAttr(alphaBuffer, alphas, 'aAlpha', 1);
      setAttr(typeBuffer, types, 'aType', 1);

      gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);
      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="bg-canvas"
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  );
};

export default ThreeBackground;
