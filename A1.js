// ASSIGNMENT-SPECIFIC API EXTENSION
THREE.Object3D.prototype.setMatrix = function(a) {
  this.matrix = a;
  this.matrix.decompose(this.position, this.quaternion, this.scale);
};

var start = Date.now();
// SETUP RENDERER AND SCENE
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff); // white background colour
document.body.appendChild(renderer.domElement);

// SETUP CAMERA
var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000); // view angle, aspect ratio, near, far
camera.position.set(10,5,10);
camera.lookAt(scene.position);
scene.add(camera);

// SETUP ORBIT CONTROL OF THE CAMERA
var controls = new THREE.OrbitControls(camera);
controls.damping = 0.2;

// ADAPT TO WINDOW RESIZE
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();

// FLOOR WITH CHECKERBOARD
var floorTexture = new THREE.ImageUtils.loadTexture('images/tile.jpg');
floorTexture.wrapS = floorTexture.wrapT = THREE.MirroredRepeatWrapping;
floorTexture.repeat.set(4, 4);

var floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture, side: THREE.DoubleSide });
var floorGeometry = new THREE.PlaneBufferGeometry(15, 15);
var floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = Math.PI / 2;
floor.position.y = 0.0;
scene.add(floor);

// TRANSFORMATIONS

function multMat(m1, m2){
  return new THREE.Matrix4().multiplyMatrices(m1, m2);
}

function inverseMat(m){
  return new THREE.Matrix4().getInverse(m, true);
}

function idMat4(){
  // Create Identity matrix
  return new THREE.Matrix4().set(1,0,0,0,
                                 0,1,0,0,
                                 0,0,1,0,
                                 0,0,0,1);
}

function translateMat(matrix, x, y, z){
  // Apply translation [x, y, z] to @matrix
  // matrix: THREE.Matrix3
  // x, y, z: float
  let translationMat = new THREE.Matrix4().set(1, 0, 0, x,
      0, 1, 0, y,
      0, 0, 1, z,
      0, 0, 0, 1);

  return multMat(translationMat, matrix);
}

function rotateMat(matrix, angle, axis){
  // Apply rotation by @angle with respect to @axis to @matrix
  // matrix: THREE.Matrix3
  // angle: float
  // axis: string "x", "y" or "z"
  let xRotationMat = new THREE.Matrix4().set(1,0,0,0,
                                             0, Math.cos(angle), -Math.sin(angle), 0,
                                             0, Math.sin(angle), Math.cos(angle), 0,
                                             0,0,0,1);
  let yRotationMat = new THREE.Matrix4().set(Math.cos(angle), 0, Math.sin(angle), 0,
                                             0, 1, 0, 0,
                                               -Math.sin(angle), 0, Math.cos(angle), 0,
                                                0, 0, 0, 1);
  let zRotationMat = new THREE.Matrix4().set(Math.cos(angle), -Math.sin(angle), 0, 0,
                                             Math.sin(angle), Math.cos(angle), 0, 0,
                                             0,0,1,0,
                                             0,0,0,1);

  if (axis === "x"){
    return multMat(xRotationMat, matrix);
    // return multMat(matrix, xRotationMat);
  }
  if (axis === "y"){
    return multMat(yRotationMat, matrix);
    // return multMat(matrix, yRotationMat);
  }
  if (axis === "z"){
    return multMat(zRotationMat, matrix);
    // return multMat(matrix, zRotationMat);
  }
}

function rotateVec3(v, angle, axis){
  // Apply rotation by @angle with respect to @axis to vector @v
  // v: THREE.Vector3
  // angle: float
  // axis: string "x", "y" or "z"
  let xRotationMat = new THREE.Matrix4().set(1,0,0,0,
      0, Math.cos(angle), -Math.sin(angle), 0,
      0, Math.sin(angle), Math.cos(angle), 0,
      0,0,0,1);
  let yRotationMat = new THREE.Matrix4().set(Math.cos(angle), 0, Math.sin(angle), 0,
      0, 1, 0, 0,
      -Math.sin(angle), 0, Math.cos(angle), 0,
      0, 0, 0, 1);
  let zRotationMat = new THREE.Matrix4().set(Math.cos(angle), -Math.sin(angle), 0, 0,
      Math.sin(angle), Math.cos(angle), 0, 0,
      0,0,1,0,
      0,0,0,1);

  if (axis === "x"){
    return v.applyMatrix4(xRotationMat);
  }
  if (axis === "y"){
    return v.applyMatrix4(yRotationMat);
  }
  if (axis === "z"){
    return v.applyMatrix4(zRotationMat);
  }

}

function rescaleMat(matrix, x, y, z){
  // Apply scaling @x, @y and @z to @matrix
  // matrix: THREE.Matrix3
  // x, y, z: float
  let rescaleMat = new THREE.Matrix4().set(x, 0,0,0,
                                            0, y, 0, 0,
                                            0, 0, z, 0,
                                            0, 0, 0, 1);
  return multMat(matrix, rescaleMat);
}

class Robot {
  constructor() {
    // Geometry
    this.torsoHeight = 1.5;
    this.torsoRadius = 0.75;
    this.headRadius = 0.32;

    // Add parameters for parts
    // TODO
    this.armRadius = 0.35;

    // Animation
    this.walkDirection = new THREE.Vector3( 0, 0, 1 );

    // Material
    this.material = new THREE.MeshNormalMaterial();

    // Initial pose
    this.initialize()
  }

  initialTorsoMatrix(){
    var initialTorsoMatrix = idMat4();
    initialTorsoMatrix = translateMat(initialTorsoMatrix, 0,this.torsoHeight/2, 0);

    return initialTorsoMatrix;
  }

  initialHeadMatrix(){
    var initialHeadMatrix = idMat4();
    initialHeadMatrix = translateMat(initialHeadMatrix, 0, this.torsoHeight/2 + this.headRadius, 0);

    return initialHeadMatrix;
  }

  initialRightArmMatrix(){
    var initRightArmMat = idMat4();
    initRightArmMat = translateMat(initRightArmMat, this.torsoRadius, this.torsoHeight * 0.38, 0);
    initRightArmMat = rescaleMat(initRightArmMat, 2, 0.5, 0.5);

    return initRightArmMat;
  }

  initialLeftArmMatrix(){
    var initLeftArmMat = idMat4();
    initLeftArmMat = translateMat(initLeftArmMat, -this.torsoRadius, this.torsoHeight * 0.38, 0);
    initLeftArmMat = rescaleMat(initLeftArmMat, 2, 0.5, 0.5);

    return initLeftArmMat;
  }

  initialRightForearmMatrix(){
    var initRightForearmMat = idMat4();
    initRightForearmMat = translateMat(initRightForearmMat, this.torsoRadius + this.armRadius * 2.7, this.torsoHeight * 0.38, 0);
    initRightForearmMat = rescaleMat(initRightForearmMat, 1.1, 0.38, 0.5);

    return initRightForearmMat;

  }

  initialLeftForearmMatrix(){
    var initLeftForearmMat = idMat4();
    initLeftForearmMat = translateMat(initLeftForearmMat, -this.torsoRadius - this.armRadius * 2.7, this.torsoHeight * 0.38, 0);
    initLeftForearmMat = rescaleMat(initLeftForearmMat, 1.1, 0.38, 0.5);

    return initLeftForearmMat;
  }

  initialize() {
    // Torso
    var torsoGeometry = new THREE.CubeGeometry(2*this.torsoRadius, this.torsoHeight, this.torsoRadius, 64);
    this.torso = new THREE.Mesh(torsoGeometry, this.material);

    // Head
    var headGeometry = new THREE.CubeGeometry(2*this.headRadius, this.headRadius, this.headRadius);
    this.head = new THREE.Mesh(headGeometry, this.material);

    // Add parts
    // TODO: leftThigh, rightThigh, leftLeg, rightLeg

    // Arms
    var armGeometry = new THREE.SphereGeometry(this.armRadius, this.armRadius, this.armRadius);
    this.rightArm = new THREE.Mesh(armGeometry, this.material);
    this.leftArm = new THREE.Mesh(armGeometry, this.material);

    // Forearms
    this.rightForearm = new THREE.Mesh(armGeometry, this.material);
    this.leftForearm = new THREE.Mesh(armGeometry, this.material);

    // Torse transformation
    this.torsoInitialMatrix = this.initialTorsoMatrix();
    this.torsoMatrix = idMat4();
    this.torso.setMatrix(this.torsoInitialMatrix);

    // Head transformation
    this.headInitialMatrix = this.initialHeadMatrix();
    this.headMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.headInitialMatrix);
    this.head.setMatrix(matrix);

    // Add transformations
    // TODO thighs and legs
    // Arms transformations
    this.rightArmInitMatrix = this.initialRightArmMatrix();
    this.rightArmMatrix = idMat4();
    var multRightArmMatrix = multMat(this.torsoInitialMatrix, this.rightArmInitMatrix);
    this.rightArm.setMatrix(multRightArmMatrix);

    this.leftArmInitMatrix = this.initialLeftArmMatrix();
    this.leftArmMatrix = idMat4();
    var multLeftArmMatrix = multMat(this.torsoInitialMatrix, this.leftArmInitMatrix);
    this.leftArm.setMatrix(multLeftArmMatrix);

    // Forearms transformations
    this.rightForearmInitMatrix = this.initialRightForearmMatrix();
    this.rightForearmMatrix = idMat4();
    var multRightForearmMatrix = multMat(this.torsoInitialMatrix, this.rightForearmInitMatrix);
    this.rightForearm.setMatrix(multRightForearmMatrix);

    this.leftForearmInitMatrix = this.initialLeftForearmMatrix();
    this.leftForearmMatrix = idMat4();
    var multLeftForearmMatrix = multMat(this.torsoInitialMatrix, this.leftForearmInitMatrix);
    this.leftForearm.setMatrix(multLeftForearmMatrix);

	// Add robot to scene
	scene.add(this.torso);
    scene.add(this.head);
    // Add parts
    // TODO: add thighs and legs
    scene.add(this.rightArm);
    scene.add(this.leftArm);
    scene.add(this.rightForearm);
    scene.add(this.leftForearm);
  }

  rotateTorso(angle){
    var torsoMatrix = this.torsoMatrix;

    this.torsoMatrix = idMat4();
    this.torsoMatrix = rotateMat(this.torsoMatrix, angle, "y");
    this.torsoMatrix = multMat(torsoMatrix, this.torsoMatrix);

    torsoMatrix = multMat(this.torsoMatrix, this.torsoInitialMatrix);
    this.torso.setMatrix(torsoMatrix);

    var headMatrix = multMat(this.headMatrix, this.headInitialMatrix);
    var headAndTorsoMatrix = multMat(torsoMatrix, headMatrix);
    this.head.setMatrix(headAndTorsoMatrix);

    var rArmMatrix = multMat(this.rightArmMatrix, this.rightArmInitMatrix);
    var rArmAndTorsoMatrix = multMat(torsoMatrix, rArmMatrix);
    this.rightArm.setMatrix(rArmAndTorsoMatrix);

    var lArmMatrix = multMat(this.leftArmMatrix, this.leftArmInitMatrix);
    var lArmAndTorsoMatrix = multMat(torsoMatrix, lArmMatrix);
    this.leftArm.setMatrix(lArmAndTorsoMatrix);

    var rForearmMatrix = multMat(this.rightForearmMatrix, this.rightForearmInitMatrix);
    var rForearmAndTorsoMatrix = multMat(torsoMatrix, rForearmMatrix);
    this.rightForearm.setMatrix(rForearmAndTorsoMatrix);

    var lForearmMatrix = multMat(this.leftForearmMatrix, this.leftForearmInitMatrix);
    var lForearmAndTorsoMatrix = multMat(torsoMatrix, lForearmMatrix);
    this.leftForearm.setMatrix(lForearmAndTorsoMatrix);

    this.walkDirection = rotateVec3(this.walkDirection, angle, "y");

  }

  moveTorso(speed){
    this.torsoMatrix = translateMat(this.torsoMatrix, speed * this.walkDirection.x, speed * this.walkDirection.y, speed * this.walkDirection.z);

    var torsoMatrix = multMat(this.torsoMatrix, this.torsoInitialMatrix);
    this.torso.setMatrix(torsoMatrix);

    var headMatrix = multMat(this.headMatrix, this.headInitialMatrix);
    var torsoAndHeadMatrix = multMat(torsoMatrix, headMatrix);
    this.head.setMatrix(torsoAndHeadMatrix);

    var rArmMatrix = multMat(this.rightArmMatrix, this.rightArmInitMatrix);
    var rArmAndTorsoMatrix = multMat(torsoMatrix, rArmMatrix);
    this.rightArm.setMatrix(rArmAndTorsoMatrix);

    var lArmMatrix = multMat(this.leftArmMatrix, this.leftArmInitMatrix);
    var lArmAndTorsoMatrix = multMat(torsoMatrix, lArmMatrix);
    this.leftArm.setMatrix(lArmAndTorsoMatrix);

    var rForearmMatrix = multMat(this.rightForearmMatrix, this.rightForearmInitMatrix);
    var rForearmAndTorsoMatrix = multMat(torsoMatrix, rForearmMatrix);
    this.rightForearm.setMatrix(rForearmAndTorsoMatrix);

    var lForearmMatrix = multMat(this.leftForearmMatrix, this.leftForearmInitMatrix);
    var lForearmAndTorsoMatrix = multMat(torsoMatrix, lForearmMatrix);
    this.leftForearm.setMatrix(lForearmAndTorsoMatrix);
  }

  rotateHead(angle){
    var headMatrix = this.headMatrix;

    this.headMatrix = idMat4();
    this.headMatrix = rotateMat(this.headMatrix, angle, "y");
    this.headMatrix = multMat(headMatrix, this.headMatrix);

    var matrix = multMat(this.headMatrix, this.headInitialMatrix);
    matrix = multMat(this.torsoMatrix, matrix);
    matrix = multMat(this.torsoInitialMatrix, matrix);
    this.head.setMatrix(matrix);
  }

  // Add methods for other parts
  // TODO
  rotateArms(angle){
    var rightArmMatrix = this.rightArmMatrix;

    this.rightArmMatrix  = this.torsoMatrix;
    this.rightArmMatrix = rotateMat(this.rightArmMatrix, angle, "z");
    this.rightArmMatrix = multMat(rightArmMatrix, this.rightArmMatrix);

    var matrix = multMat(this.rightArmMatrix, this.rightArmInitMatrix);
    matrix = multMat(this.torsoMatrix, matrix);
    matrix = multMat(this.torsoInitialMatrix, matrix);
    this.rightArm.setMatrix(matrix);

  }

}

var robot = new Robot();

// LISTEN TO KEYBOARD
var keyboard = new THREEx.KeyboardState();

var selectedRobotComponent = 0;
var components = [
  "Torso",
  "Head",
  "RightArm",
  // Add parts names
  // TODO
];
var numberComponents = components.length;

function checkKeyboard() {
  // Next element
  if (keyboard.pressed("e")){
    selectedRobotComponent = selectedRobotComponent + 1;

    if (selectedRobotComponent<0){
      selectedRobotComponent = numberComponents - 1;
    }

    if (selectedRobotComponent >= numberComponents){
      selectedRobotComponent = 0;
    }

    window.alert(components[selectedRobotComponent] + " selected");
  }

  // Previous element
  if (keyboard.pressed("q")){
    selectedRobotComponent = selectedRobotComponent - 1;

    if (selectedRobotComponent < 0){
      selectedRobotComponent = numberComponents - 1;
    }

    if (selectedRobotComponent >= numberComponents){
      selectedRobotComponent = 0;
    }

    window.alert(components[selectedRobotComponent] + " selected");
  }

  // UP
  if (keyboard.pressed("w")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.moveTorso(0.1);
        break;
      case "Head":
        break;
      // Add more cases
      // TODO
    }
  }

  // DOWN
  if (keyboard.pressed("s")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.moveTorso(-0.1);
        break;
      case "Head":
        break;
      // Add more cases
      // TODO
    }
  }

  // LEFT
  if (keyboard.pressed("a")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.rotateTorso(0.1);
        break;
      case "Head":
        robot.rotateHead(0.1);
        break;
      // Add more cases
      // TODO
    }
  }

  // RIGHT
  if (keyboard.pressed("d")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.rotateTorso(-0.1);
        break;
      case "Head":
        robot.rotateHead(-0.1);
        break;
      // Add more cases
      // TODO
      case "RightArm":
        robot.rotateArms(-0.1);
    }
  }
}

// SETUP UPDATE CALL-BACK
function update() {
  checkKeyboard();
  requestAnimationFrame(update);
  renderer.render(scene, camera);
}

update();