import { useEffect, useRef, useState } from 'react'
import { MotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion'

const RAMP = ['#241a2e', '#5c4668', '#9a7a45', '#e9dcc0'].map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255))
const CRIMSON = [0xb3, 0x22, 0x1a].map((value) => value / 255)

const VERTEX = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

const FRAGMENT = `
precision mediump float;
uniform sampler2D u_image;
uniform float u_progress;
uniform float u_seed;
uniform vec2 u_scale;
uniform vec3 u_ramp[4];
uniform vec3 u_crimson;
varying vec2 v_uv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float value = 0.0, amplitude = 0.5;
  for (int i = 0; i < 4; i++) { value += amplitude * noise(p); p *= 2.03; amplitude *= 0.5; }
  return value;
}

void main() {
  vec2 uv = (v_uv - 0.5) * u_scale + 0.5;
  uv.y = 1.0 - uv.y;
  vec4 texel = texture2D(u_image, uv);
  vec3 photo = texel.rgb;

  // Brush strokes: the paint drags the image along short oblique strokes
  vec2 stroke = vec2(fbm(uv * vec2(6.0, 28.0) + u_seed), fbm(uv * vec2(28.0, 6.0) - u_seed)) - 0.5;
  vec3 smeared = texture2D(u_image, uv + stroke * 0.018).rgb;
  float light = dot(smeared, vec3(0.299, 0.587, 0.114)) + (fbm(uv * 90.0 + u_seed) - 0.5) * 0.16;

  vec3 paint = mix(u_ramp[0], u_ramp[1], smoothstep(0.2, 0.3, light));
  paint = mix(paint, u_ramp[2], smoothstep(0.42, 0.52, light));
  paint = mix(paint, u_ramp[3], smoothstep(0.68, 0.78, light));
  float red = smoothstep(0.18, 0.34, smeared.r - max(smeared.g, smeared.b));
  paint = mix(paint, u_crimson, red);

  // The gouache bleeds over the photo from a noise front
  float front = fbm(uv * 2.5 + u_seed * 3.0);
  float covered = smoothstep(front - 0.06, front, u_progress * 1.2 - 0.1);
  vec3 color = mix(photo, paint, covered);
  color *= 0.9 + 0.1 * noise(v_uv * 700.0);

  // Torn paper edge
  vec2 edge = min(v_uv, 1.0 - v_uv);
  float torn = 0.006 + 0.014 * fbm(v_uv * 40.0 + u_seed);
  float alpha = smoothstep(torn - 0.002, torn, min(edge.x, edge.y)) * texel.a;
  gl_FragColor = vec4(color * alpha, alpha);
}`

const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type) as WebGLShader
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return shader
}

type Source = HTMLImageElement | HTMLCanvasElement

// Draws `image` repainted as a poster; returns the redraw for a new progress, or null without WebGL
// A composed canvas is drawn for its box and fills it; a poster covers its box like `object-fit: cover`
const paint = (canvas: HTMLCanvasElement, image: Source, seed: number, fill = false) => {
  const ratioOf = image instanceof HTMLImageElement ? image.naturalWidth / image.naturalHeight : image.width / image.height
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false })

  if (!gl) {
    return null
  }

  const program = gl.createProgram() as WebGLProgram
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT))
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Unable to paint the poster, shown as is', gl.getProgramInfoLog(program))
    return null
  }

  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

  const uniform = (name: string) => gl.getUniformLocation(program, name)
  gl.uniform1f(uniform('u_seed'), seed)
  gl.uniform3fv(uniform('u_ramp'), RAMP.flat())
  gl.uniform3fv(uniform('u_crimson'), CRIMSON)

  return (progress: number) => {
    const width = Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio, 2))
    const height = Math.round(canvas.clientHeight * Math.min(window.devicePixelRatio, 2))

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    const ratio = fill ? 1 : (width / height) / ratioOf
    gl.viewport(0, 0, width, height)
    gl.uniform2f(uniform('u_scale'), Math.min(ratio, 1), Math.min(1 / ratio, 1))
    gl.uniform1f(uniform('u_progress'), progress)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
}

const seedOf = (src: string) => [...src].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 997, 7) / 97

// Painted over as the element scrolls from the bottom of the screen to its middle
export const useRevealProgress = (target: React.RefObject<HTMLElement>) => {
  const { scrollYProgress } = useScroll({ target, offset: ['start end', 'center center'] })
  return useTransform(scrollYProgress, [0.15, 1], [0, 1], { clamp: true })
}

// A WebGL context is only held while the poster is near the screen: phones cap how many live at once
const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image()
  image.decoding = 'async'
  image.onload = () => resolve(image)
  image.onerror = reject
  image.src = src
})

export const Painted = ({ src, alt, progress, className, compose }: { src?: string, alt: string, progress: MotionValue<number>, className?: string, compose?: (width: number, height: number) => Promise<HTMLCanvasElement> }) => {
  const box = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: '100% 0px' })
    box.current && observer.observe(box.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={box} className={`painted ${className || ''}`}>
      {src || compose ? (near && <Canvas key={src || 'composed'} src={src} compose={compose} alt={alt} progress={progress} />) : <Missing alt={alt} />}
    </div>
  )
}

const Missing = ({ alt }: { alt: string }) => (
  <div className="painted-missing" role="img" aria-label={alt}>
    <span aria-hidden="true">{alt}</span>
  </div>
)

const Canvas = ({ src, compose, alt, progress }: { src?: string, compose?: (width: number, height: number) => Promise<HTMLCanvasElement>, alt: string, progress: MotionValue<number> }) => {
  const canvas = useRef<HTMLCanvasElement>(null)
  const draw = useRef<((progress: number) => void) | null>(null)
  const [state, setState] = useState<'painting' | 'fallback' | 'missing'>('painting')
  const reduced = useReducedMotion()

  useEffect(() => {
    let cancelled = false
    const dpr = Math.min(window.devicePixelRatio, 2)
    ;(compose ? compose((canvas.current?.clientWidth || 1) * dpr, (canvas.current?.clientHeight || 1) * dpr) : loadImage(src as string)).then(
      (source) => {
        if (cancelled || !canvas.current) {
          return
        }

        draw.current = paint(canvas.current, source, seedOf(src || alt), !!compose)
        draw.current ? draw.current(reduced ? 1 : progress.get()) : setState(src ? 'fallback' : 'missing')
      },
      () => !cancelled && setState('missing'),
    )

    const resize = new ResizeObserver(() => draw.current?.(reduced ? 1 : progress.get()))
    const current = canvas.current
    current && resize.observe(current)

    return () => {
      cancelled = true
      resize.disconnect()
      draw.current = null

      // Released once the canvas has left the page, not when an effect merely reruns on it
      if (current && !current.isConnected) {
        current.getContext('webgl')?.getExtension('WEBGL_lose_context')?.loseContext()
      }
    }
  }, [src, reduced])

  useMotionValueEvent(progress, 'change', (value) => !reduced && draw.current?.(value))

  if (state === 'missing') {
    return <Missing alt={alt} />
  }

  if (state === 'fallback') {
    return <img className="painted-fallback" src={src} alt={alt} />
  }

  return <canvas ref={canvas} role="img" aria-label={alt} />
}
