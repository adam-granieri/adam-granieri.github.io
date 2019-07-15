//import * as THREE from 'three'
var dom
var sun
var ground
var rollingGround
var hero
var worldRollSpeed = 0.008
var heroRollSpeed
var worldRadius = 26
var heroRadius = 0.2
var sphereHelper
var pathAngles
var heroBaseY = 1.8
var bounceVal = 0.1
var gravity = 0.005
var leftLane = -1
var rightLane = 1
var middleLane = 0
var currLane
var clock
var jump
var treeGenInterval = 0.5
var lastTreeTime = 0
var treesInView
var totalTrees
var particleGeometry
var particleCount = 20
var explosionPower = 1.06
var particles, scoreText, score, hasCollided

// Three.js elements
var sceneWidth, sceneHeight, camera, scene, renderer

// Function Calls
init()

// Function Definitions
function init () {
  createScene()
  animate()
}

function animate () {
  rollingGround.rotation.x += worldRollSpeed
  hero.rotation.x -= heroRollSpeed
  if (hero.position.y <= heroBaseY) {
    jump = false
    bounceVal = (Math.random() * 0.04) + 0.005
  }

  hero.position.y += bounceVal
  hero.position.x = THREE.Math.lerp(hero.position.x, currLane, 2 * clock.getDelta())
  bounceVal -= gravity
  if (clock.getElapsedTime() > treeGenInterval) {
    clock.start()
    addTreeInPath()
    if (!hasCollided) {
      score += 2 * treeGenInterval
      scoreText.innerHTML = score.toString
    }
  }

  treeLogic()
  explosionLogic()
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}

function createScene () {
  // Initialize values
  hasCollided = false
  score = 0
  treesInView = []
  totalTrees = []
  clock = new THREE.Clock()
  clock.start()
  heroRollSpeed = (worldRollSpeed * worldRadius) / heroRadius / 5
  sphereHelper = new THREE.Spherical()
  pathAngles = [1.52, 1.57, 1.62]

  // Scene data
  sceneHeight = window.innerHeight
  sceneWidth = window.innerWidth
  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0xf0fff0, 0.14)

  // Camera
  camera = new THREE.PerspectiveCamera(60, sceneWidth / sceneHeight, 0.1, 1000)
  camera.position.z = 6.5
  camera.position.y = 2.5

  // Renderer
  renderer = new THREE.WebGLRenderer({ alpha: true })
  renderer.setClearColor(0xfffafa, 1)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setSize(sceneWidth, sceneHeight)
  dom = document.getElementById('container')
  dom.appendChild(renderer.domElement)

  // Individual Function Calls for geometries, animations and lighting
  generateTrees()
  generateWorld()
  generateHero()
  generateLighting()
  generateExplosion()

  window.addEventListener('resize', onWindowResize, false)
  document.onkeydown = handleKeyPress

  // Score
  scoreText = document.createElement('div')
  scoreText.style.position = 'absolute'
  scoreText.style.width = 100
  scoreText.style.height = 100
  scoreText.style.top = 50 + 'px'
  scoreText.style.left = 10 + 'px'
  scoreText.innerHTML = '0'
  document.body.appendChild(scoreText)
}

// Scene Related Functions
function generateTrees () {
  var maxTrees = 10
  var tree
  for (var i = 0; i < maxTrees; i++) {
    tree = createTree()
    totalTrees.push(tree)
  }
}

function generateWorld () {
  var sides = 40
  var tiers = 40
  var sphereGeometry = new THREE.SphereGeometry(worldRadius, sides, tiers)
  var sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xfffafa , shading: THREE.FlatShading })
  var vertexIndex
  var vertexVector = new THREE.Vector3()
  var nextVertexVector = new THREE.Vector3()
  var firstVertexVector = new THREE.Vector3()
  var offset = new THREE.Vector3()
  var currentTier = 1
  var lerpValue = 0.5
  var heightValue
  var maxHeight = 0.07

  for (var j = 1; j < tiers - 2; j++) {
    currentTier = j
    for (var i = 0; i < sides; i++) {
      vertexIndex = (currentTier * sides) + 1
      vertexVector = sphereGeometry.vertices[i + vertexIndex].clone()
      if (j % 2 !== 0) {
        if (i === 0) {
          firstVertexVector = vertexVector.clone()
        }
        nextVertexVector = sphereGeometry.vertices[i + vertexIndex + 1].clone()
        if (i === sides - 1) {
          nextVertexVector = firstVertexVector
        }
        lerpValue = (Math.random() * (0.75 - 0.25)) + 0.25
        vertexVector.lerp(nextVertexVector, lerpValue)
      }
      heightValue = (Math.random() * maxHeight) - (maxHeight / 2)
      offset = vertexVector.clone().normalize().multiplyScalar(heightValue)
      sphereGeometry.vertices[i + vertexIndex] = (vertexVector.add(offset))
    }
  }

  rollingGround = new THREE.Mesh(sphereGeometry, sphereMaterial)
  rollingGround.receiveShadow = true
  rollingGround.castShadow = false
  rollingGround.rotation.z = -Math.PI / 2
  scene.add(rollingGround)
  rollingGround.position.y = -24
  rollingGround.position.z = 2

  var numTrees = 36
  var treeGap = 6.28 / 36
  for (var k = 0; k < numTrees; k++) {
    addTree(false, k * treeGap, true)
    addTree(false, k * treeGap, false)
  }
}

function generateHero () {
  var sphereGeometry = new THREE.DodecahedronGeometry(heroRadius, 1)
  var sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xe5f2f2, shading: THREE.FlatShading })
  jump = false
  hero = new THREE.Mesh(sphereGeometry, sphereMaterial)
  hero.receiveShadow = true
  hero.castShadow = true
  scene.add(hero)
  hero.position.y = heroBaseY
  hero.position.z = 4.8
  currLane = middleLane
  hero.position.x = currLane
}

function generateLighting () {
  var light = new THREE.HemisphereLight(0xfffafa, 0x000000, -0.9)
  scene.add(light)

  sun = new THREE.DirectionalLight(0xcdc1c5, 0.9)
  sun.position.set(12, 6, -7)
  sun.castShadow = true
  sun.shadow.mapSize.width = 256
  sun.shadow.mapSize.height = 256
  sun.shadow.camera.near = 0.5
  sun.shadow.camera.far = 50
  scene.add(sun)
}

function generateExplosion () {
  particleGeometry = new THREE.Geometry()
  for (var i = 0; i < particleCount; i++) {
    var vertex = new THREE.Vector3()
    particleGeometry.vertices.push(vertex)
  }

  var particleMaterial = new THREE.PointsMaterial({ color: 0xfffafa, size: 0.2 })
  if (particleGeometry === null) {
    console.log("particleGeometry null")
  } else if (particleMaterial === null) {
    console.log("material null")
  }
  particles = new THREE.Points(particleGeometry, particleMaterial)
  particles.visible = false
  scene.add(particles)
}

function addTree (inPath, row, isLeft) {
  var newTree
  if (inPath) {
    if (totalTrees.length === 0) {
      return
    }
    newTree = totalTrees.pop()
    newTree.visible = true
    treesInView.push(newTree)
    sphereHelper.set(worldRadius - 0.3, pathAngles[row], -rollingGround.rotation.x + 4)
  } else {
    newTree = createTree()
    var forestAngle = 0
    if (isLeft) {
      forestAngle = 1.68 + Math.random() * 0.1
    } else {
      forestAngle = 1.47 + Math.random() * 0.1
    }
    sphereHelper.set(worldRadius - 0.3, forestAngle, row)
  }

  newTree.position.setFromSpherical(sphereHelper)
  var rollingGroundVector = rollingGround.position.clone().normalize()
  var treeVector = newTree.position.clone().normalize()
  newTree.quaternion.setFromUnitVectors(treeVector, rollingGroundVector)
  newTree.rotation.x += (Math.random() * (2 * Math.PI / 10)) + -Math.PO / 10
  rollingGround.add(newTree)
}

function addTreeInPath () {
  var laneOptions = [0, 1, 2]
  var lane = Math.floor(Math.random() * 3)
  addTree(true, lane)
  laneOptions.splice(lane, 1)

  if (Math.random() > 0.5) {
    lane = Math.floor(Math.random() * 2)
    addTree(true, laneOptions[lane])
  }
}

function createTree () {
  var sides = 8
  var tiers = 6
  var scalarMultiplier = Math.random() * (0.25 - 0.1) + 0.05
  var midPointVector = new THREE.Vector3()
  var vertexVector = new THREE.Vector3()
  var treeGeometry = new THREE.ConeGeometry(0.5, 1, sides, tiers)
  var treeMaterial = new THREE.MeshStandardMaterial({
    color: 0x33ff33,
    shading: THREE.FlatShading
  })

  var offset
  midPointVector = treeGeometry.vertices[0].clone()
  var currentTier = 0
  var vertexIndex

  blowUpTree(treeGeometry.vertices, sides, 0, scalarMultiplier)
  tightenTree(treeGeometry.vertices, sides, 1)
  blowUpTree(treeGeometry.vertices, sides, 2, scalarMultiplier * 1.1, true)
  tightenTree(treeGeometry.vertices, sides, 3)
  blowUpTree(treeGeometry.vertices, sides, 4, scalarMultiplier * 1.2)
  tightenTree(treeGeometry.vertices, sides, 5)

  var treeTop = new THREE.Mesh(treeGeometry, treeMaterial)
  treeTop.castShadow = true
  treeTop.receiveShadow = false
  treeTop.position.y = 0.9
  treeTop.rotation.y = Math.random() * Math.PI

  var treeTrunkGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5)
  var trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x886633,
    shading: THREE.FlatShading
  })
  var treeTrunk = new THREE.Mesh(treeTrunkGeometry, trunkMaterial)
  treeTrunk.position.y = 0.25
  var tree = new THREE.Object3D()
  tree.add(treeTrunk)
  tree.add(treeTop)
  return tree
}

function blowUpTree (vertices, sides, currentTier, scalarMultiplier, odd) {
  var vertexIndex
  var vertexVector = new THREE.Vector3()
  var midPointVector = vertices[0].clone()
  var offset

  for (var i = 0; i < sides; i++) {
    vertexIndex = (currentTier * sides) + 1
    vertexVector = vertices[i + vertexIndex].clone()
    midPointVector.y = vertexVector.y
    offset = vertexVector.sub(midPointVector)
    if (odd) {
      if (i % 2 === 0) {
        offset.normalize().multiplyScalar(scalarMultiplier / 6)
        vertices[i + vertexIndex].add(offset)
      } else {
        offset.normalize().multiplyScalar(scalarMultiplier)
        vertices[i + vertexIndex].add(offset)
        vertices[i + vertexIndex].y = vertices[i + vertexIndex + sides].y + 0.05
      }
    } else {
      if (i % 2 !== 0) {
        offset.normalize().multiplyScalar(scalarMultiplier / 6)
        vertices[i + vertexIndex].add(offset)
      } else {
        offset.normalize().multiplyScalar(scalarMultiplier)
        vertices[i + vertexIndex].add(offset)
        vertices[i + vertexIndex].y = vertices[i + vertexIndex + sides].y + 0.05
      }
    }
  }
}

function tightenTree (vertices, sides, currentTier) {
  var vertexIndex
  var vertexVector = new THREE.Vector3()
  var midPointVector = vertices[0].clone()
  var offset

  for (var i = 0; i < sides; i++) {
    vertexIndex = (currentTier % sides) + 1
    vertexVector = vertices[i + vertexIndex].clone()
    midPointVector.y = vertexVector.y
    offset = vertexVector.sub(midPointVector)
    offset.normalize().multiplyScalar(0.06)
    vertices[i + vertexIndex].sub(offset)
  }
}

// Logic Functions
function treeLogic () {
  var tree
  var positionVector = new THREE.Vector3()
  var treeRemoval = []

  treesInView.forEach(function (el, index) {
    tree = treesInView[index]
    positionVector.setFromMatrixPosition(tree.matrixWorld)
    if (positionVector.z > 6 && tree.visible) {
      treeRemoval.push(tree)
    } else {
      if (positionVector.distanceTo(hero.position) <= 0.6) {
        hasCollided = true
        explodeAnimation()
      }
    }
  })

  var fromWhere
  treeRemoval.forEach(function (el, index) {
    tree = treeRemoval[index]
    fromWhere = treesInView.indexOf(tree)
    treesInView.splice(fromWhere, 1)
    totalTrees.push(tree)
    tree.visible = false
  })
}

function explosionLogic () {
  if (!particles.visible) {
    return
  }

  for (var i = 0; i < particleCount; i++) {
    particleGeometry.vertices[i].multiplyScalar(explosionPower)
  }

  if (explosionPower > 1.005) {
    explosionPower -= 0.001
  } else {
    particles.visible = false
  }

  particleGeometry.verticesNeedUpdate = true
}

function explodeAnimation () {
  particles.position.set(hero.position.x, 2, 4.8)
  for (var i = 0; i < particleCount; i++) {
    var vertex = new THREE.Vector3()
    vertex.set(-0.2 + Math.random() * 0.4, -0.2 + Math.random() * 0.4, -0.2 + Math.random() * 0.4)
    particleGeometry.vertices[i] = vertex
  }

  particleGeometry.verticesNeedUpdate = true
}

// Control Functions and Resizing
function onWindowResize () {
  sceneHeight = window.innerHeight
  sceneWidth = window.innerWidth
  renderer.setSize(sceneWidth, sceneHeight)
  camera.aspect = sceneWidth / sceneHeight
  camera.updateProjectionMatrix()
}

function handleKeyPress (keyEvent) {
  if (jump) {
    return
  }

  var valid = true
  switch (keyEvent.keyCode) {
    case 37: // Left Arrow
      if (currLane === middleLane) {
        currLane = leftLane
      } else if (currLane === rightLane) {
        currLane = middleLane
      } else {
        valid = false
      }
      break
    case 38: // Up Arrow
      bounceVal = 0.1
      jump = true
      valid = false
      break
    case 39: // Right Arrow
      if (currLane === middleLane) {
        currLane = rightLane
      } else if (currLane === leftLane) {
        currLane = middleLane
      } else {
        valid = false
      }
      break
    default: break
  }

  if (valid) {
    jump = true
    bounceVal = 0.05
  }
}
