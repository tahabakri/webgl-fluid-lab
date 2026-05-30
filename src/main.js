import * as THREE from 'three'
import './style.css'

import vertexShaderSource from './shaders/vertex.glsl?raw'
import simFragmentShaderSource from './shaders/simulation.frag.glsl?raw'
import renderFragmentShaderSource from './shaders/render.frag.glsl?raw'

function init() {
  const canvas = document.getElementById('webgl_canvas')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  let width = window.innerWidth
  let height = window.innerHeight

  // Tunable simulation state, driven by the control panel.
  const settings = {
    phrase: 'SOFT HORIZON',
    damping: 0.985,
    displacement: 0.16,
    brushRadius: 45.0,
  }

  const textInput = document.getElementById('custom_text_input')
  const dampingSlider = document.getElementById('damping_slider')
  const dispSlider = document.getElementById('disp_slider')

  // ---------------------------------------------------------------------------
  // Text texture: rasterise the headline + subtitle to a 2D canvas, then upload
  // it as a GPU texture that the render pass refracts.
  // ---------------------------------------------------------------------------
  const textCanvas = document.createElement('canvas')
  const textCtx = textCanvas.getContext('2d')

  const buildTextTexture = () => {
    textCanvas.width = width * dpr
    textCanvas.height = height * dpr

    textCtx.fillStyle = '#ff5a19'
    textCtx.fillRect(0, 0, textCanvas.width, textCanvas.height)

    const fontSize = Math.round(140 * dpr)
    textCtx.font = `800 ${fontSize}px 'Inter', sans-serif`
    textCtx.fillStyle = '#fff8e7'
    textCtx.textAlign = 'center'
    textCtx.textBaseline = 'middle'
    textCtx.letterSpacing = '-0.05em'
    textCtx.fillText(settings.phrase, textCanvas.width / 2, textCanvas.height / 2)

    const subFontSize = Math.round(18 * dpr)
    textCtx.font = `400 ${subFontSize}px 'JetBrains Mono', monospace`
    textCtx.fillStyle = 'rgba(255, 248, 231, 0.45)'
    textCtx.letterSpacing = '0.2em'
    textCtx.fillText(
      'INTERACTIVE WATER REFRACTION LAB',
      textCanvas.width / 2,
      textCanvas.height / 2 + 110 * dpr,
    )
  }

  buildTextTexture()

  // ---------------------------------------------------------------------------
  // Renderer + scenes. Two orthographic full-screen quads: one drives the
  // simulation into a render target, the other draws the refracted result.
  // ---------------------------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(dpr)
  renderer.setSize(width, height)

  const simScene = new THREE.Scene()
  const renderScene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  // RGBA float render targets hold the wave field (R = current, G = previous).
  const rtOptions = {
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  }

  let rtA = new THREE.WebGLRenderTarget(width * dpr, height * dpr, rtOptions)
  let rtB = new THREE.WebGLRenderTarget(width * dpr, height * dpr, rtOptions)

  const textTexture = new THREE.CanvasTexture(textCanvas)
  textTexture.minFilter = THREE.LinearFilter
  textTexture.magFilter = THREE.LinearFilter
  // Sample raw (no sRGB decode) so colours match the original prototype.
  textTexture.colorSpace = THREE.NoColorSpace

  const mouse = new THREE.Vector2(0, 0)
  let isMouseActive = false

  const simMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShaderSource,
    fragmentShader: simFragmentShaderSource,
    uniforms: {
      uResolution: { value: new THREE.Vector2(width * dpr, height * dpr) },
      uMouse: { value: mouse },
      uDamping: { value: settings.damping },
      uBrushRadius: { value: settings.brushRadius },
      uMouseActive: { value: 0.0 },
      uPrevTexture: { value: null },
    },
    depthWrite: false,
    depthTest: false,
  })

  const renderMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShaderSource,
    fragmentShader: renderFragmentShaderSource,
    uniforms: {
      uResolution: { value: new THREE.Vector2(width * dpr, height * dpr) },
      uDisplacement: { value: settings.displacement },
      uSimTexture: { value: null },
      uTextTexture: { value: textTexture },
    },
    depthWrite: false,
    depthTest: false,
  })

  const quadGeometry = new THREE.PlaneGeometry(2, 2)
  simScene.add(new THREE.Mesh(quadGeometry, simMaterial))
  renderScene.add(new THREE.Mesh(quadGeometry, renderMaterial))

  // ---------------------------------------------------------------------------
  // Live controls
  // ---------------------------------------------------------------------------
  textInput.addEventListener('input', (e) => {
    settings.phrase = e.target.value.toUpperCase()
    buildTextTexture()
    textTexture.needsUpdate = true
  })

  dampingSlider.addEventListener('input', (e) => {
    settings.damping = parseFloat(e.target.value)
    simMaterial.uniforms.uDamping.value = settings.damping
  })

  dispSlider.addEventListener('input', (e) => {
    settings.displacement = parseFloat(e.target.value)
    renderMaterial.uniforms.uDisplacement.value = settings.displacement
  })

  // ---------------------------------------------------------------------------
  // Pointer / touch input — normalised to 0..1 UV space (Y flipped for WebGL).
  // ---------------------------------------------------------------------------
  const handleMouseMove = (e) => {
    isMouseActive = true
    mouse.set(e.clientX / width, 1.0 - e.clientY / height)
  }

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      isMouseActive = true
      mouse.set(e.touches[0].clientX / width, 1.0 - e.touches[0].clientY / height)
    }
  }

  window.addEventListener('mousemove', handleMouseMove, { passive: true })
  window.addEventListener('touchmove', handleTouchMove, { passive: true })
  window.addEventListener('mouseleave', () => { isMouseActive = false })
  window.addEventListener('touchend', () => { isMouseActive = false })

  // ---------------------------------------------------------------------------
  // Resize
  // ---------------------------------------------------------------------------
  const handleResize = () => {
    width = window.innerWidth
    height = window.innerHeight

    renderer.setSize(width, height)
    rtA.setSize(width * dpr, height * dpr)
    rtB.setSize(width * dpr, height * dpr)

    simMaterial.uniforms.uResolution.value.set(width * dpr, height * dpr)
    renderMaterial.uniforms.uResolution.value.set(width * dpr, height * dpr)

    buildTextTexture()
    textTexture.needsUpdate = true
  }
  window.addEventListener('resize', handleResize)

  // ---------------------------------------------------------------------------
  // Render loop — ping-pong the two render targets each frame.
  // ---------------------------------------------------------------------------
  const loop = () => {
    requestAnimationFrame(loop)

    // Pass 1: advance the wave field into rtB using rtA as the previous state.
    simMaterial.uniforms.uPrevTexture.value = rtA.texture
    simMaterial.uniforms.uMouse.value.copy(mouse)
    simMaterial.uniforms.uMouseActive.value = isMouseActive ? 1.0 : 0.0

    renderer.setRenderTarget(rtB)
    renderer.render(simScene, camera)

    // Pass 2: refract the text texture with the fresh wave field, draw to screen.
    renderMaterial.uniforms.uSimTexture.value = rtB.texture
    renderer.setRenderTarget(null)
    renderer.render(renderScene, camera)

    // Swap buffers for the next frame.
    const swap = rtA
    rtA = rtB
    rtB = swap
  }

  loop()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
