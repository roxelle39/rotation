
import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import {
  multiply,
  cross,
  applyMatrix,
  transformVector,
  transformSVector
} from './algebra.js'

// ==========================================
// 1. INITIALISATION DE L'APPLICATION
// ==========================================

const app = document.querySelector('#app')

if (!app) {
  throw new Error("L'élément #app est introuvable.")
}

app.innerHTML = ''

// ==========================================
// 2. PARAMÈTRES INITIAUX
// ==========================================

// Valeurs initiales modifiables par l'utilisateur.
// Aucun coefficient n'est fixé mathématiquement.

let M = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
]

const A = {
  a: 1,
  u: { x: 1, y: 1, z: 0.5 }
}

const B = {
  a: 1,
  u: { x: 0, y: 1, z: 0 }
}

const probe = { x: 1, y: 1, z: 1 }

// ==========================================
// 3. STRUCTURE DE L'INTERFACE
// ==========================================

const layout = document.createElement('div')
layout.id = 'workspace'

const sceneContainer = document.createElement('div')
sceneContainer.id = 'scene-container'

const controlsPanel = document.createElement('aside')
controlsPanel.id = 'controls-panel'

layout.append(sceneContainer, controlsPanel)
app.appendChild(layout)

// ==========================================
// 4. FONCTIONS DES CHAMPS
// ==========================================

function numberField(id, label, value) {
  return `
    <label class="field">
      <span>${label}</span>
      <input
        id="${id}"
        type="number"
        step="any"
        value="${value}"
      >
    </label>
  `
}

function vectorFields(prefix, vector) {
  return `
    <div class="vector-fields">
      ${numberField(prefix + '-x', 'x', vector.x)}
      ${numberField(prefix + '-y', 'y', vector.y)}
      ${numberField(prefix + '-z', 'z', vector.z)}
    </div>
  `
}

function readNumber(id) {
  const input = document.getElementById(id)

  if (!input || input.value.trim() === '') return 0

  const value = Number(input.value)

  return Number.isFinite(value) ? value : 0
}

function readVector(prefix) {
  return {
    x: readNumber(prefix + '-x'),
    y: readNumber(prefix + '-y'),
    z: readNumber(prefix + '-z')
  }
}

function format(n) {
  if (Math.abs(n) < 0.0000001) n = 0
  return Number(n.toFixed(4)).toString()
}

function vectorText(v) {
  return `(${format(v.x)}, ${format(v.y)}, ${format(v.z)})`
}

// ==========================================
// 5. MATRICE GÉNÉRALE M
// ==========================================

function matrixFields() {
  let html = '<div class="matrix-grid">'

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      html += numberField(
        `m-${i}-${j}`,
        `m${i + 1}${j + 1}`,
        M[i][j]
      )
    }
  }

  html += '</div>'

  return html
}

// ==========================================
// 6. INTERFACE
// ==========================================

controlsPanel.innerHTML = `
  <header class="app-header">
    <h1>Explorateur des algèbres A_M</h1>
    <p>Algèbre réelle de dimension 4</p>
  </header>

  <section class="panel">
    <h2>1. Matrice générale M</h2>
    <p class="description">
      Modifier librement les neuf coefficients.
    </p>
    ${matrixFields()}
  </section>

  <section class="panel">
    <h2>2. Élément A</h2>
    ${numberField('a-scalar', 'Partie scalaire a', A.a)}
    <p class="description">Partie vectorielle u</p>
    ${vectorFields('a', A.u)}
  </section>

  <section class="panel">
    <h2>3. Élément B</h2>
    ${numberField('b-scalar', 'Partie scalaire b', B.a)}
    <p class="description">Partie vectorielle v</p>
    ${vectorFields('b', B.u)}
  </section>

  <section class="panel">
    <h2>4. Produit A * B</h2>

    <div class="result">
      <p>Partie scalaire</p>
      <strong id="scalar-result">0</strong>

      <p>Partie vectorielle</p>
      <strong id="vector-result">(0, 0, 0)</strong>
    </div>

    <div class="legend">
      <p><span class="dot yellow"></span> Vecteur u</p>
      <p><span class="dot green"></span> Partie vectorielle de A * B</p>
      <p><span class="dot purple"></span> M(u × v)</p>
    </div>
  </section>

  <section class="panel">
    <h2>5. Transformations T et S</h2>

    <p class="description">Angle de transformation</p>
    ${numberField('angle-input', 'Angle θ (degrés)', 90)}

    <p class="description">Axe de transformation n</p>
    ${vectorFields('n', { x: 0, y: 0, z: 1 })}

    <p class="description">Vecteur test p</p>
    ${vectorFields('p', probe)}

    <div class="result">
      <h3>T(p)</h3>
      <p>Partie scalaire</p>
      <strong id="scalar-T">0</strong>
      <p>Partie vectorielle</p>
      <strong id="vector-T">(0, 0, 0)</strong>

      <h3>S(p)</h3>
      <p>Partie scalaire</p>
      <strong id="scalar-S">0</strong>
      <p>Partie vectorielle</p>
      <strong id="vector-S">(0, 0, 0)</strong>
    </div>
  </section>

  <section class="panel">
    <h2>6. Visualisation 3D</h2>

    <div class="legend">
      <p><span class="dot" style="background:#2589ff"></span>
        Cube initial
      </p>

      <p><span class="dot" style="background:#ff6688"></span>
        Transformation T
      </p>

      <p><span class="dot" style="background:#b78aff"></span>
        Transformation S
      </p>
    </div>

    <p class="description">
      Comparaison géométrique des trois cubes.
    </p>
  </section>
`

// ==========================================
// 7. SCÈNE THREE.JS
// ==========================================

const scene = new THREE.Scene()

scene.background = new THREE.Color(0x101522)

const camera = new THREE.PerspectiveCamera(
  50,
  1,
  0.1,
  1000
)

camera.position.set(10, 8, 13)

const renderer = new THREE.WebGLRenderer({
  antialias: true
})

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
)

sceneContainer.appendChild(renderer.domElement)

const controls = new OrbitControls(
  camera,
  renderer.domElement
)

controls.enableDamping = true
controls.target.set(0, 0, 0)

// ==========================================
// 8. ÉCLAIRAGE
// ==========================================

scene.add(
  new THREE.AmbientLight(0xffffff, 1.5)
)

const directionalLight = new THREE.DirectionalLight(
  0xffffff,
  2
)

directionalLight.position.set(5, 8, 6)

scene.add(directionalLight)

// ==========================================
// 9. REPÈRE ET GRILLE
// ==========================================

const grid = new THREE.GridHelper(
  20,
  20,
  0x557799,
  0x29364d
)

scene.add(grid)

const axes = new THREE.AxesHelper(4)

scene.add(axes)

// ==========================================
// 10. SOMMETS ET ARÊTES DU CUBE
// ==========================================

const cubeVertices = [
  [-1, -1, -1],
  [ 1, -1, -1],
  [ 1,  1, -1],
  [-1,  1, -1],
  [-1, -1,  1],
  [ 1, -1,  1],
  [ 1,  1,  1],
  [-1,  1,  1]
]

const cubeEdges = [
  0, 1, 1, 2, 2, 3, 3, 0,
  4, 5, 5, 6, 6, 7, 7, 4,
  0, 4, 1, 5, 2, 6, 3, 7
]

// ==========================================
// 11. CUBE INITIAL
// ==========================================

const initialGeometry = new THREE.BoxGeometry(2, 2, 2)

const initialMaterial = new THREE.MeshStandardMaterial({
  color: 0x2589ff,
  metalness: 0.2,
  roughness: 0.4
})

const cube = new THREE.Mesh(
  initialGeometry,
  initialMaterial
)

cube.position.set(-3, 0, 0)

scene.add(cube)

const initialOutline = new THREE.LineSegments(
  new THREE.EdgesGeometry(initialGeometry),
  new THREE.LineBasicMaterial({
    color: 0xffffff
  })
)

cube.add(initialOutline)

// ==========================================
// 12. FONCTION DE CRÉATION DES CUBES T ET S
// ==========================================

function createTransformedCube(color, position) {

  const geometry = new THREE.BufferGeometry()

  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      new Float32Array(24),
      3
    )
  )

  geometry.setIndex(cubeEdges)

  const material = new THREE.LineBasicMaterial({
    color: color,
    linewidth: 2
  })

  const object = new THREE.LineSegments(
    geometry,
    material
  )

  object.position.set(
    position.x,
    position.y,
    position.z
  )

  scene.add(object)

  return {
    geometry,
    object
  }
}

// Cube rose : transformation T
const cubeT = createTransformedCube(
  0xff6688,
  { x: 3, y: 0, z: 0 }
)

// Cube violet : transformation S
const cubeS = createTransformedCube(
  0xb78aff,
  { x: 0, y: 0, z: 4 }
)

// ==========================================
// 13. VECTEURS ET FLÈCHES
// ==========================================

function createArrow(color) {

  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1,
    color,
    0.3,
    0.2
  )

  scene.add(arrow)

  return arrow
}

const arrowU = createArrow(0xffcc33)
const arrowResult = createArrow(0x65e6b2)
const arrowCross = createArrow(0xb78aff)

function updateArrow(arrow, vector, origin) {

  const length = Math.hypot(
    vector.x,
    vector.y,
    vector.z
  )

  arrow.position.copy(origin)

  if (length < 0.000001) {
    arrow.visible = false
    return
  }

  arrow.visible = true

  arrow.setDirection(
    new THREE.Vector3(
      vector.x,
      vector.y,
      vector.z
    ).normalize()
  )

  arrow.setLength(
    length,
    Math.min(0.3, length * 0.3),
    Math.min(0.2, length * 0.2)
  )
}

// ==========================================
// 14. LECTURE DE LA MATRICE M
// ==========================================

function updateMatrix() {

  M = []

  for (let i = 0; i < 3; i++) {

    M[i] = []

    for (let j = 0; j < 3; j++) {

      M[i][j] = readNumber(`m-${i}-${j}`)
    }
  }

  updateAll()
}

// ==========================================
// 15. LECTURE DES ÉLÉMENTS A ET B
// ==========================================

function updateElements() {

  A.a = readNumber('a-scalar')
  A.u = readVector('a')

  B.a = readNumber('b-scalar')
  B.u = readVector('b')

  updateAll()
}

// ==========================================
// 16. CALCUL DU PRODUIT ALGÉBRIQUE
// ==========================================

function updateAlgebra() {

  const result = multiply(A, B, M)

  const crossProduct = cross(A.u, B.u)

  const transformedCross = applyMatrix(
    M,
    crossProduct
  )

  document.getElementById('scalar-result').textContent =
    format(result.a)

  document.getElementById('vector-result').textContent =
    vectorText(result.u)

  updateArrow(
    arrowU,
    A.u,
    new THREE.Vector3(-3, 0, 0)
  )

  updateArrow(
    arrowResult,
    result.u,
    new THREE.Vector3(0, 0, 0)
  )

  updateArrow(
    arrowCross,
    transformedCross,
    new THREE.Vector3(3, 0, 0)
  )
}

// ==========================================
// 17. CONSTRUCTION DE q
// ==========================================

function getQuaternionData() {

  const angle = readNumber('angle-input')

  const theta = angle * Math.PI / 180

  let n = readVector('n')

  const norm = Math.hypot(
    n.x,
    n.y,
    n.z
  )

  if (norm < 0.000001) {

    n = { x: 0, y: 0, z: 0 }

  } else {

    n = {
      x: n.x / norm,
      y: n.y / norm,
      z: n.z / norm
    }
  }

  const c = Math.cos(theta / 2)
  const s = Math.sin(theta / 2)

  return {
    a: c,

    u: {
      x: s * n.x,
      y: s * n.y,
      z: s * n.z
    }
  }
}

// ==========================================
// 18. CALCUL DES TRANSFORMATIONS T ET S
// ==========================================

function updateTransformations() {

  const q = getQuaternionData()

  const p = readVector('p')

  const T = transformVector(p, q, M)

  const S = transformSVector(p, q, M)

  document.getElementById('scalar-T').textContent =
    format(T.a)

  document.getElementById('vector-T').textContent =
    vectorText(T.u)

  document.getElementById('scalar-S').textContent =
    format(S.a)

  document.getElementById('vector-S').textContent =
    vectorText(S.u)

  updateTransformedCube(q)
}

// ==========================================
// 19. TRANSFORMATION GÉOMÉTRIQUE DES DEUX CUBES
// ==========================================

function updateTransformedCube(q) {

  const positionsT = []
  const positionsS = []

  for (const vertex of cubeVertices) {

    const p = {
      x: vertex[0],
      y: vertex[1],
      z: vertex[2]
    }

    // Transformation T(p) = (q * (0,p)) * qbar
    const resultT = transformVector(p, q, M)

    positionsT.push(
      resultT.u.x,
      resultT.u.y,
      resultT.u.z
    )

    // Transformation S(p) = q * ((0,p) * qbar)
    const resultS = transformSVector(p, q, M)

    positionsS.push(
      resultS.u.x,
      resultS.u.y,
      resultS.u.z
    )
  }

  // Actualisation du cube T
  cubeT.geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      positionsT,
      3
    )
  )

  cubeT.geometry.computeBoundingSphere()

  // Actualisation du cube S
  cubeS.geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      positionsS,
      3
    )
  )

  cubeS.geometry.computeBoundingSphere()
}

// ==========================================
// 20. ACTUALISATION GÉNÉRALE
// ==========================================

function updateAll() {

  updateAlgebra()

  updateTransformations()
}

// ==========================================
// 21. ÉCOUTE DES MODIFICATIONS
// ==========================================

controlsPanel.querySelectorAll('input').forEach(input => {

  input.addEventListener('input', () => {

    if (input.id.startsWith('m-')) {

      updateMatrix()

    } else if (
      input.id.startsWith('a-') ||
      input.id.startsWith('b-')
    ) {

      updateElements()

    } else {

      updateAll()
    }
  })
})

// ==========================================
// 22. ANIMATION DES TROIS CUBES
// ==========================================

function animate() {

  requestAnimationFrame(animate)

  // Rotation synchronisée
  cube.rotation.y += 0.003
  cube.rotation.x += 0.0015

  cubeT.object.rotation.copy(cube.rotation)
  cubeS.object.rotation.copy(cube.rotation)

  controls.update()

  renderer.render(scene, camera)
}

// ==========================================
// 23. ADAPTATION DE LA FENÊTRE
// ==========================================

function resize() {

  const width = sceneContainer.clientWidth
  const height = sceneContainer.clientHeight

  if (!width || !height) return

  camera.aspect = width / height

  camera.updateProjectionMatrix()

  renderer.setSize(width, height)
}

window.addEventListener('resize', resize)

// ==========================================
// 24. LANCEMENT
// ==========================================

resize()

updateAll()

animate()
