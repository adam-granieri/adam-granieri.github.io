var dom, sun, ground, rollingGround, hero, worldRollSpeed=0.008, heroRollSpeed;
var worldRadius = 26, heroRadius = 0.2, sphereHelper, pathAngles;
var heroBaseY = 1.8, bounceVal = 0.1, gravity = 0.005, leftLane = -1, rightLane = 1;
var middleLane = 0, currLane, clock, jump, treeGenInterval = 0.5, lastTreeTime = 0;
var treesInView, totalTrees, particleGeometry, particleCount = 20; explosionPower = 1.06;
var particles, scoreText, score, hasCollided;

// Three.js elements
var sceneWidth, sceneHeight, camera, scene, renderer

// Function Calls
init();

// Function Definitions
function init() {
    createScene();
    update();
}

function createScene() {
    // Initialize values
    hasCollided = false;
    score = 0;
    treesInView = [];
    totalTrees = [];
    clock = new THREE.Clock();
    clock.start();
    heroRollSpeed = ( worldRollSpeed*worldRadius/heroRadius ) / 5;
    sphereHelper = new THREE.Spherical();
    pathAngles = [1.52, 1.57, 1.62];
    
    // Scene data
    sceneHeight = window.innerHeight;
    sceneWidth = window.innerWidth;
    scene = new THREE.Scene();
    scene.fog = new THREE.FofExp2( 0xf0fff0, 0.14 );

    // Camera
    camera = new THREE.PerspectiveCamera( 60, sceneWidth/sceneHeight, 0.1, 1000 );
    camera.position.z = 6.5;
    camera.position.y = 2.5;

    // Renderer
    renderer = new THREE.WebGLRenderer({alpha:true});
    renderer.setClearColor( 0xfffafa, 1 );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize( sceneWidth, sceneHeight );
    dom = document.getElementById('container');
    dom.appendChild( renderer.domElement );

    // Individual Function Calls for geometries, animations and lighting
    generateTrees();
    generateWorld();
    generateHero();
    generateLighting();
    generateExplosion();

    window.addEventListener('resize', onWindowResize, false);
    document.onkeydown = handleKeyDown;

    // Score
    scoreText = document.createElement('div');
    scoreText.style.position = 'absolute';
    scoreText.style.width = 100;
    scoreText.style.height = 100;
    scoreText.style.top = 50 + 'px';
    scoreText.style.left = 10 +'px';
    scoreText.innerHTML = "0";
    document.body.appendChild(scoreText);
}

function generateTrees() {
    var maxTrees = 10, tree;
    for (var i = 0; i < maxTrees; i++) {
        tree = createTree();
        totalTrees.push(tree);
    }
}

function createTree() {
    var sides = 8, tiers = 6;
	var scalarMultiplier = (Math.random()*(0.25-0.1))+0.05;
	var midPointVector= new THREE.Vector3();
	var vertexVector= new THREE.Vector3();
	var treeGeometry = new THREE.ConeGeometry( 0.5, 1, sides, tiers);
	var treeMaterial = new THREE.MeshStandardMaterial( { color: 0x33ff33, shading: THREE.FlatShading } );
	var offset;
	midPointVector = treeGeometry.vertices[0].clone();
	var currentTier = 0;
	var vertexIndex;
	blowUpTree(treeGeometry.vertices, sides, 0, scalarMultiplier);
	tightenTree(treeGeometry.vertices,sides,1);
	blowUpTree(treeGeometry.vertices,sides,2,scalarMultiplier*1.1,true);
	tightenTree(treeGeometry.vertices,sides,3);
	blowUpTree(treeGeometry.vertices,sides,4,scalarMultiplier*1.2);
	tightenTree(treeGeometry.vertices,sides,5);
	var treeTop = new THREE.Mesh( treeGeometry, treeMaterial );
	treeTop.castShadow = true;
	treeTop.receiveShadow = false;
	treeTop.position.y = 0.9;
	treeTop.rotation.y = (Math.random()*(Math.PI));
	var treeTrunkGeometry = new THREE.CylinderGeometry( 0.1, 0.1,0.5);
	var trunkMaterial = new THREE.MeshStandardMaterial( { color: 0x886633,shading:THREE.FlatShading  } );
	var treeTrunk = new THREE.Mesh( treeTrunkGeometry, trunkMaterial );
	treeTrunk.position.y = 0.25;
	var tree = new THREE.Object3D();
	tree.add(treeTrunk);
	tree.add(treeTop);
	return tree;
}