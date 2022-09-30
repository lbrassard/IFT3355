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
var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000); // view angle, aspect ratio, near, far
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
  THREE.p
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
    //Parts parameters
    this.torsoHeight = 1.5;
    this.torsoRadius = 0.75;
    this.headRadius = 0.32;
    this.armRadius = 0.35;
    this.rightArmZAngle = 0;
    this.leftArmZAngle = 0;
    this.rightArmXAngle = 0;
    this.leftArmXAngle = 0;
    this.rightForearmXAngle = 0;
    this.leftForearmXAngle = 0;
    this.rightThighXAngle = 0;
    this.leftThighXAngle = 0;

    this.thighRadius = 0.35;
    this.legRadius = 0.35;

    // Animation
    this.walkDirection = new THREE.Vector3( 0, 0, 1 );

    // Material
    this.material = new THREE.MeshNormalMaterial();

    // Initial pose
    this.initialize()
  }

  initialTorsoMatrix(){
    var initialTorsoMatrix = idMat4();
    initialTorsoMatrix = translateMat(initialTorsoMatrix, 0,this.torsoHeight*1.70, 0);

    return initialTorsoMatrix;
  }

  initialHeadMatrix(){
    var initialHeadMatrix = idMat4();
    initialHeadMatrix = translateMat(initialHeadMatrix, 0, this.torsoHeight/2 + this.headRadius, 0);

    return initialHeadMatrix;
  }

  initialRightArmMatrix(){
    var initRightArmMat = idMat4();
    initRightArmMat = translateMat(initRightArmMat, this.torsoRadius * 1.12, 0, 0);
    initRightArmMat = rescaleMat(initRightArmMat, 0.7, 1.7, 0.7);

    return initRightArmMat;
  }

  initialLeftArmMatrix(){
    var initLeftArmMat = idMat4();
    initLeftArmMat = translateMat(initLeftArmMat, -this.torsoRadius * 1.12, 0, 0);
    initLeftArmMat = rescaleMat(initLeftArmMat, 0.7, 1.7, 0.7);

    return initLeftArmMat;
  }

  initialRightForearmMatrix(){
    var initRightForearmMat = idMat4();
    initRightForearmMat = translateMat(initRightForearmMat, this.torsoRadius * 1.12, -1, 0);
    initRightForearmMat = rescaleMat(initRightForearmMat, 0.5, 2 * 0.7, 0.6);

    return initRightForearmMat;

  }

  initialLeftForearmMatrix(){
    var initLeftForearmMat = idMat4();
    initLeftForearmMat = translateMat(initLeftForearmMat, -this.torsoRadius * 1.12, -1, 0);
    initLeftForearmMat = rescaleMat(initLeftForearmMat, 0.5, 2 * 0.7, 0.6);

    return initLeftForearmMat;
  }

  initialLeftThighMatrix(){
    var initLeftThighMat = idMat4();
    initLeftThighMat = translateMat(initLeftThighMat,-this.torsoRadius/2,-this.torsoHeight*0.85,0);
    initLeftThighMat = rescaleMat(initLeftThighMat,0.6,1.5,0.5);

    return initLeftThighMat
  }

  initialRightThighMatrix(){
    var initRightThighMat = idMat4();
    initRightThighMat = translateMat(initRightThighMat,this.torsoRadius/2,-this.torsoHeight*0.85,0);
    initRightThighMat = rescaleMat(initRightThighMat,0.6,1.5,0.5);

    return initRightThighMat
  }

  initialLeftLegMatrix(){
    var initLeftLegMat = idMat4();
    initLeftLegMat = translateMat(initLeftLegMat,-this.torsoRadius/2,-this.torsoHeight*1.4,0);
    initLeftLegMat = rescaleMat(initLeftLegMat,0.45,1.1,0.5);

    return initLeftLegMat
  }

  initialRightLegMatrix(){
    var initRightLegMat = idMat4();
    initRightLegMat = translateMat(initRightLegMat,this.torsoRadius/2,-this.torsoHeight*1.40,0);
    initRightLegMat = rescaleMat(initRightLegMat,0.45,1.1,0.5);

    return initRightLegMat
  }

  initialize() {
    // Torso
    var torsoGeometry = new THREE.CubeGeometry(2*this.torsoRadius, this.torsoHeight, this.torsoRadius, 64);
    this.torso = new THREE.Mesh(torsoGeometry, this.material);

    // Head
    var headGeometry = new THREE.CubeGeometry(2*this.headRadius, this.headRadius, this.headRadius);
    this.head = new THREE.Mesh(headGeometry, this.material);


    //Thighs
    var thighGeometry = new THREE.SphereGeometry(this.thighRadius,this.thighRadius,this.thighRadius);
    this.rightThigh = new THREE.Mesh(thighGeometry,this.material);
    this.leftThigh = new THREE.Mesh(thighGeometry,this.material);

    //Legs
    var legGeometry = new THREE.SphereGeometry(this.thighRadius,this.thighRadius,this.thighRadius);
    this.rightLeg = new THREE.Mesh(thighGeometry,this.material);
    this.leftLeg = new THREE.Mesh(thighGeometry,this.material);

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


    //Thighs transformations
    this.leftThighInitMatrix = this.initialLeftThighMatrix();
    this.leftThighMatrix = idMat4();
    var multLeftThighMatrix = multMat(this.torsoInitialMatrix, this.leftThighInitMatrix);
    this.leftThigh.setMatrix(multLeftThighMatrix);

    this.rightThighInitMatrix = this.initialRightThighMatrix();
    this.rightThighMatrix = idMat4();
    var multRightThighMatrix = multMat(this.torsoInitialMatrix, this.rightThighInitMatrix);
    this.rightThigh.setMatrix(multRightThighMatrix);


    //Legs transformations
    this.leftLegInitMatrix = this.initialLeftLegMatrix();
    this.leftLegMatrix = idMat4();
    var multLeftLegMatrix = multMat(this.torsoInitialMatrix, this.leftLegInitMatrix);
    this.leftLeg.setMatrix(multLeftLegMatrix);

    this.rightLegInitMatrix = this.initialRightLegMatrix();
    this.rightLegMatrix = idMat4();
    var multRightLegMatrix = multMat(this.torsoInitialMatrix, this.rightLegInitMatrix);
    this.rightLeg.setMatrix(multRightLegMatrix);

	// Add robot to scene
	  scene.add(this.torso);
    scene.add(this.head);
    scene.add(this.rightArm);
    scene.add(this.leftArm);
    scene.add(this.rightForearm);
    scene.add(this.leftForearm);
    scene.add(this.rightThigh);
    scene.add(this.leftThigh);
    scene.add(this.rightLeg);
    scene.add(this.leftLeg);
    
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

    var rThighMatrix = multMat(this.rightThighMatrix, this.rightThighInitMatrix);
    var rThighAndTorsoMatrix = multMat(torsoMatrix, rThighMatrix);
    this.rightThigh.setMatrix(rThighAndTorsoMatrix);

    var lThighMatrix = multMat(this.leftThighMatrix, this.leftThighInitMatrix);
    var lThighAndTorsoMatrix = multMat(torsoMatrix, lThighMatrix);
    this.leftThigh.setMatrix(lThighAndTorsoMatrix);

    var rLegMatrix = multMat(this.rightLegMatrix, this.rightLegInitMatrix);
    var rLegAndTorsoMatrix = multMat(torsoMatrix, rLegMatrix);
    this.rightLeg.setMatrix(rLegAndTorsoMatrix);

    var lLegMatrix = multMat(this.leftLegMatrix, this.leftLegInitMatrix);
    var lLegAndTorsoMatrix = multMat(torsoMatrix, lLegMatrix);
    this.leftLeg.setMatrix(lLegAndTorsoMatrix);

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

    var rLegMatrix = multMat(this.rightLegMatrix, this.rightLegInitMatrix)
    var rLegAndTorsoMatrix = multMat(torsoMatrix,rLegMatrix)
    this.rightLeg.setMatrix(rLegAndTorsoMatrix)

    var lLegMatrix = multMat(this.leftLegMatrix, this.leftLegInitMatrix)
    var lLegAndTorsoMatrix = multMat(torsoMatrix,lLegMatrix)
    this.leftLeg.setMatrix(lLegAndTorsoMatrix)

    var rThighMatrix = multMat(this.rightThighMatrix, this.rightThighInitMatrix)
    var rThighAndTorsoMatrix = multMat(torsoMatrix,rThighMatrix)
    this.rightThigh.setMatrix(rThighAndTorsoMatrix)

    var lThighMatrix = multMat(this.leftThighMatrix, this.leftThighInitMatrix)
    var lThighAndTorsoMatrix = multMat(torsoMatrix,lThighMatrix)
    this.leftThigh.setMatrix(lThighAndTorsoMatrix)

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
  // TODO: thighs, legs and foreamrs
  zRotateRightArm(angle){
    var xTranslate = 0.9;
    var yTranslate = 0.4;
    var zTranslate = 0;
    var tempRightForearmXAngle = this.rightForearmXAngle;

    if(this.rightForearmXAngle != 0){
      this.xRotateRightForearm(-tempRightForearmXAngle);
    }

    if(this.rightArmZAngle > 0 && angle < 0) {
      this.rightArmZAngle += angle;

      var rightArmMatrix = this.rightArmMatrix;
      var rightForearmMatrix = this.rightForearmMatrix;
      console.log("z =" + this.rightArmZAngle.toString());


      // Right arm z rotation
      this.rightArmMatrix = idMat4();
      this.rightArmMatrix = translateMat(this.rightArmMatrix, -xTranslate, -yTranslate, -zTranslate);
      this.rightArmMatrix = rotateMat(this.rightArmMatrix, angle, "z");
      this.rightArmMatrix = translateMat(this.rightArmMatrix, xTranslate, yTranslate, zTranslate);
      this.rightArmMatrix = multMat(rightArmMatrix, this.rightArmMatrix);

      var matrix = multMat(this.rightArmMatrix, this.rightArmInitMatrix);
      matrix = multMat(this.torsoMatrix, matrix);
      matrix = multMat(this.torsoInitialMatrix, matrix);
      this.rightArm.setMatrix(matrix);

      // Right forearm z rotation
      this.rightForearmMatrix = idMat4();
      this.rightForearmMatrix = translateMat(this.rightForearmMatrix, -xTranslate, -yTranslate, -zTranslate);
      this.rightForearmMatrix = rotateMat(this.rightForearmMatrix, angle, "z");
      this.rightForearmMatrix = translateMat(this.rightForearmMatrix, xTranslate, yTranslate, zTranslate);
      this.rightForearmMatrix = multMat(rightForearmMatrix, this.rightForearmMatrix);

      var matrix2 = multMat(this.rightForearmMatrix, this.rightForearmInitMatrix);
      matrix2 = multMat(this.torsoMatrix, matrix2);
      matrix2 = multMat(this.torsoInitialMatrix, matrix2);
      this.rightForearm.setMatrix(matrix2);
    }
    else if(this.rightArmZAngle < 2.2 && angle > 0) {
      this.rightArmZAngle += angle;
      if (this.rightArmZAngle > 2.3) {
        this.rightArmZAngle = 0;
      }
      var rightArmMatrix = this.rightArmMatrix;
      var rightForearmMatrix = this.rightForearmMatrix;
      console.log("z =" + this.rightArmZAngle.toString());

      // Right arm z rotation
      this.rightArmMatrix = idMat4();
      this.rightArmMatrix = translateMat(this.rightArmMatrix, -xTranslate, -yTranslate, -zTranslate);
      this.rightArmMatrix = rotateMat(this.rightArmMatrix, angle, "z");
      this.rightArmMatrix = translateMat(this.rightArmMatrix, xTranslate, yTranslate, zTranslate);
      this.rightArmMatrix = multMat(rightArmMatrix, this.rightArmMatrix);

      var matrix = multMat(this.rightArmMatrix, this.rightArmInitMatrix);
      matrix = multMat(this.torsoMatrix, matrix);
      matrix = multMat(this.torsoInitialMatrix, matrix);
      this.rightArm.setMatrix(matrix);

      // Right forearm z rotation
      this.rightForearmMatrix = idMat4();
      this.rightForearmMatrix = translateMat(this.rightForearmMatrix, -xTranslate, -yTranslate, -zTranslate);
      this.rightForearmMatrix = rotateMat(this.rightForearmMatrix, angle, "z");
      this.rightForearmMatrix = translateMat(this.rightForearmMatrix, xTranslate, yTranslate, zTranslate);
      this.rightForearmMatrix = multMat(rightForearmMatrix, this.rightForearmMatrix);

      var matrix2 = multMat(this.rightForearmMatrix, this.rightForearmInitMatrix);
      matrix2 = multMat(this.torsoMatrix, matrix2);
      matrix2 = multMat(this.torsoInitialMatrix, matrix2);
      this.rightForearm.setMatrix(matrix2);
    }
    if(tempRightForearmXAngle != 0){
      this.xRotateRightForearm(tempRightForearmXAngle);
    }
  }

  zRotateLeftArm(angle){
    var xTranslate = 0.9;
    var yTranslate = 0.4;
    var zTranslate = 0;
    var tempLeftForearmXAngle = this.leftForearmXAngle;

    if(this.leftForearmXAngle != 0){
      this.xRotateLeftForearm(-tempLeftForearmXAngle);
    }

    if(this.leftArmZAngle > -1.4 && angle < 0) {
      this.leftArmZAngle += angle;
      if (this.leftArmZAngle < -1.5) {
        this.leftArmZAngle = 0.1;
      }
      var leftArmMatrix = this.leftArmMatrix;
      var leftForearmMatrix = this.leftForearmMatrix;
      console.log("z1= " + this.leftArmZAngle.toString());

      // Left arm z rotation
      this.leftArmMatrix = idMat4();
      this.leftArmMatrix = translateMat(this.leftArmMatrix, xTranslate, -yTranslate, zTranslate);
      this.leftArmMatrix = rotateMat(this.leftArmMatrix, angle, "z");
      this.leftArmMatrix = translateMat(this.leftArmMatrix, -xTranslate, yTranslate, -zTranslate);
      this.leftArmMatrix = multMat(leftArmMatrix, this.leftArmMatrix);

      var matrix = multMat(this.leftArmMatrix, this.leftArmInitMatrix);
      matrix = multMat(this.torsoMatrix, matrix);
      matrix = multMat(this.torsoInitialMatrix, matrix);
      this.leftArm.setMatrix(matrix);

      // Left forearm z rotation
      this.leftForearmMatrix = idMat4();
      this.leftForearmMatrix = translateMat(this.leftForearmMatrix, xTranslate, -yTranslate, zTranslate);
      this.leftForearmMatrix = rotateMat(this.leftForearmMatrix, angle, "z");
      this.leftForearmMatrix = translateMat(this.leftForearmMatrix, -xTranslate, yTranslate, -zTranslate);
      this.leftForearmMatrix = multMat(leftForearmMatrix, this.leftForearmMatrix);

      var matrix2 = multMat(this.leftForearmMatrix, this.leftForearmInitMatrix);
      matrix2 = multMat(this.torsoMatrix, matrix2);
      matrix2 = multMat(this.torsoInitialMatrix, matrix2);
      this.leftForearm.setMatrix(matrix2);
    }
    else if(this.leftArmZAngle < 0 && angle > 0) {
      this.leftArmZAngle += angle;
      if (this.leftArmZAngle > 1.1) {
        this.leftArmZAngle = 0;
      }
      var leftArmMatrix = this.leftArmMatrix;
      var leftForearmMatrix = this.leftForearmMatrix;
      console.log("z2= " + this.leftArmZAngle.toString());

      // Left arm z rotation
      this.leftArmMatrix = idMat4();
      this.leftArmMatrix = translateMat(this.leftArmMatrix, xTranslate, -yTranslate, zTranslate);
      this.leftArmMatrix = rotateMat(this.leftArmMatrix, angle, "z");
      this.leftArmMatrix = translateMat(this.leftArmMatrix, -xTranslate, yTranslate, -zTranslate);
      this.leftArmMatrix = multMat(leftArmMatrix, this.leftArmMatrix);

      var matrix = multMat(this.leftArmMatrix, this.leftArmInitMatrix);
      matrix = multMat(this.torsoMatrix, matrix);
      matrix = multMat(this.torsoInitialMatrix, matrix);
      this.leftArm.setMatrix(matrix);

      // Left forearm z rotation
      this.leftForearmMatrix = idMat4();
      this.leftForearmMatrix = translateMat(this.leftForearmMatrix, xTranslate, -yTranslate, zTranslate);
      this.leftForearmMatrix = rotateMat(this.leftForearmMatrix, angle, "z");
      this.leftForearmMatrix = translateMat(this.leftForearmMatrix, -xTranslate, yTranslate, -zTranslate);
      this.leftForearmMatrix = multMat(leftForearmMatrix, this.leftForearmMatrix);

      var matrix2 = multMat(this.leftForearmMatrix, this.leftForearmInitMatrix);
      matrix2 = multMat(this.torsoMatrix, matrix2);
      matrix2 = multMat(this.torsoInitialMatrix, matrix2);
      this.leftForearm.setMatrix(matrix2);
    }
    if(tempLeftForearmXAngle != 0){
      this.xRotateLeftForearm(tempLeftForearmXAngle);
    }
  }

  xRotateRightArm(angle){
    var xTranslate = 0.5;
    var yTranslate = 0.5;
    var zTranslate = 0;
    var tempRightForearmXAngle = this.rightForearmXAngle;

    if(this.rightForearmXAngle != 0){
      this.xRotateRightForearm(-tempRightForearmXAngle);
    }

    if(this.rightArmXAngle > -2.7 && angle < 0) {
      this.rightArmXAngle += angle;
      if (this.rightArmXAngle < -2.8) {
        this.rightArmXAngle = 0;
      }
      var rightArmMatrix = this.rightArmMatrix;
      var rightForearmMatrix = this.rightForearmMatrix;
      console.log("x =" + this.rightArmXAngle.toString());

      // Right arm x rotation
      this.rightArmMatrix = idMat4();
      this.rightArmMatrix = translateMat(this.rightArmMatrix, -xTranslate, -yTranslate, -zTranslate);
      this.rightArmMatrix = rotateMat(this.rightArmMatrix, angle, "x");
      this.rightArmMatrix = translateMat(this.rightArmMatrix, xTranslate, yTranslate, zTranslate);
      this.rightArmMatrix = multMat(rightArmMatrix, this.rightArmMatrix);

      var matrix = multMat(this.rightArmMatrix, this.rightArmInitMatrix);
      matrix = multMat(this.torsoMatrix, matrix);
      matrix = multMat(this.torsoInitialMatrix, matrix);
      this.rightArm.setMatrix(matrix);

      // Right forearm x rotation
      this.rightForearmMatrix = idMat4();
      this.rightForearmMatrix = translateMat(this.rightForearmMatrix, -xTranslate, -yTranslate, -zTranslate);
      this.rightForearmMatrix = rotateMat(this.rightForearmMatrix, angle, "x");
      this.rightForearmMatrix = translateMat(this.rightForearmMatrix, xTranslate, yTranslate, zTranslate);
      this.rightForearmMatrix = multMat(rightForearmMatrix, this.rightForearmMatrix);

      var matrix2 = multMat(this.rightForearmMatrix, this.rightForearmInitMatrix);
      matrix2 = multMat(this.torsoMatrix, matrix2);
      matrix2 = multMat(this.torsoInitialMatrix, matrix2);
      this.rightForearm.setMatrix(matrix2);
    }
    else if(this.rightArmXAngle < 0.9 && angle > 0) {
      this.rightArmXAngle += angle;
      if (this.rightArmXAngle > 1) {
        this.rightArmXAngle = 0;
      }
      var rightArmMatrix = this.rightArmMatrix;
      var rightForearmMatrix = this.rightForearmMatrix;
      console.log("x =" + this.rightArmXAngle.toString());

      // Right arm x rotation
      this.rightArmMatrix = idMat4();
      this.rightArmMatrix = translateMat(this.rightArmMatrix, -xTranslate, -yTranslate, -zTranslate);
      this.rightArmMatrix = rotateMat(this.rightArmMatrix, angle, "x");
      this.rightArmMatrix = translateMat(this.rightArmMatrix, xTranslate, yTranslate, zTranslate);
      this.rightArmMatrix = multMat(rightArmMatrix, this.rightArmMatrix);

      var matrix = multMat(this.rightArmMatrix, this.rightArmInitMatrix);
      matrix = multMat(this.torsoMatrix, matrix);
      matrix = multMat(this.torsoInitialMatrix, matrix);
      this.rightArm.setMatrix(matrix);

      // Right forearm x rotation
      this.rightForearmMatrix = idMat4();
      this.rightForearmMatrix = translateMat(this.rightForearmMatrix, -xTranslate, -yTranslate, -zTranslate);
      this.rightForearmMatrix = rotateMat(this.rightForearmMatrix, angle, "x");
      this.rightForearmMatrix = translateMat(this.rightForearmMatrix, xTranslate, yTranslate, zTranslate);
      this.rightForearmMatrix = multMat(rightForearmMatrix, this.rightForearmMatrix);

      var matrix2 = multMat(this.rightForearmMatrix, this.rightForearmInitMatrix);
      matrix2 = multMat(this.torsoMatrix, matrix2);
      matrix2 = multMat(this.torsoInitialMatrix, matrix2);
      this.rightForearm.setMatrix(matrix2);
    }
    if(tempRightForearmXAngle != 0){
      this.xRotateRightForearm(tempRightForearmXAngle);
    }
  }

  xRotateLeftArm(angle){
    var xTranslate = 0.5;
    var yTranslate = 0.5;
    var zTranslate = 0;
    var tempLeftForearmXAngle = this.leftForearmXAngle;

    if(this.leftForearmXAngle != 0){
      this.xRotateLeftForearm(-tempLeftForearmXAngle);
    }

    if(this.leftArmXAngle > -2.8 && angle < 0) {
      this.leftArmXAngle += angle;
      if (this.leftArmXAngle < -2.9) {
        this.leftArmXAngle = 0;
      }
      var leftArmMatrix = this.leftArmMatrix;
      var leftForearmMatrix = this.leftForearmMatrix;
      console.log("x= " + this.leftArmXAngle.toString())

      // Left arm y rotation
      this.leftArmMatrix = idMat4();
      this.leftArmMatrix = translateMat(this.leftArmMatrix, -xTranslate, -yTranslate, -zTranslate);
      this.leftArmMatrix = rotateMat(this.leftArmMatrix, angle, "x");
      this.leftArmMatrix = translateMat(this.leftArmMatrix, xTranslate, yTranslate, zTranslate);
      this.leftArmMatrix = multMat(leftArmMatrix, this.leftArmMatrix);

      var matrix = multMat(this.leftArmMatrix, this.leftArmInitMatrix);
      matrix = multMat(this.torsoMatrix, matrix);
      matrix = multMat(this.torsoInitialMatrix, matrix);
      this.leftArm.setMatrix(matrix);

      // Left forearm y rotation
      this.leftForearmMatrix = idMat4();
      this.leftForearmMatrix = translateMat(this.leftForearmMatrix, -xTranslate, -yTranslate, -zTranslate);
      this.leftForearmMatrix = rotateMat(this.leftForearmMatrix, angle, "x");
      this.leftForearmMatrix = translateMat(this.leftForearmMatrix, xTranslate, yTranslate, zTranslate);
      this.leftForearmMatrix = multMat(leftForearmMatrix, this.leftForearmMatrix);

      var matrix2 = multMat(this.leftForearmMatrix, this.leftForearmInitMatrix);
      matrix2 = multMat(this.torsoMatrix, matrix2);
      matrix2 = multMat(this.torsoInitialMatrix, matrix2);
      this.leftForearm.setMatrix(matrix2);
    }
    else if(this.leftArmXAngle < 0.9 && angle > 0) {
      this.leftArmXAngle += angle;
      if (this.leftArmXAngle > 1) {
        this.leftArmXAngle = 0;
      }
      var leftArmMatrix = this.leftArmMatrix;
      var leftForearmMatrix = this.leftForearmMatrix;
      console.log("x= " + this.leftArmXAngle.toString())

      // Left arm y rotation
      this.leftArmMatrix = idMat4();
      this.leftArmMatrix = translateMat(this.leftArmMatrix, -xTranslate, -yTranslate, -zTranslate);
      this.leftArmMatrix = rotateMat(this.leftArmMatrix, angle, "x");
      this.leftArmMatrix = translateMat(this.leftArmMatrix, xTranslate, yTranslate, zTranslate);
      this.leftArmMatrix = multMat(leftArmMatrix, this.leftArmMatrix);

      var matrix = multMat(this.leftArmMatrix, this.leftArmInitMatrix);
      matrix = multMat(this.torsoMatrix, matrix);
      matrix = multMat(this.torsoInitialMatrix, matrix);
      this.leftArm.setMatrix(matrix);

      // Left forearm y rotation
      this.leftForearmMatrix = idMat4();
      this.leftForearmMatrix = translateMat(this.leftForearmMatrix, -xTranslate, -yTranslate, -zTranslate);
      this.leftForearmMatrix = rotateMat(this.leftForearmMatrix, angle, "x");
      this.leftForearmMatrix = translateMat(this.leftForearmMatrix, xTranslate, yTranslate, zTranslate);
      this.leftForearmMatrix = multMat(leftForearmMatrix, this.leftForearmMatrix);

      var matrix2 = multMat(this.leftForearmMatrix, this.leftForearmInitMatrix);
      matrix2 = multMat(this.torsoMatrix, matrix2);
      matrix2 = multMat(this.torsoInitialMatrix, matrix2);
      this.leftForearm.setMatrix(matrix2);
    }
    if(tempLeftForearmXAngle != 0){
      this.xRotateLeftForearm(tempLeftForearmXAngle);
    }
  }

  xRotateRightForearm(angle){
    var xTranslate = 0.5;
    var yTranslate = 0.5;
    var zTranslate = 0;

    if(this.rightForearmXAngle > -2 && angle < 0) {
      this.rightForearmXAngle += angle;
      if (this.rightForearmXAngle < -2.1) {
        this.rightForearmXAngle = 0;
      }
      var rightForearmMatrix = this.rightForearmMatrix;
      console.log(this.rightForearmXAngle.toString());

      // Right forearm y rotation
      this.rightForearmMatrix = idMat4();
      this.rightForearmMatrix = translateMat(this.rightForearmMatrix, xTranslate, yTranslate, zTranslate);
      this.rightForearmMatrix = rotateMat(this.rightForearmMatrix, angle, "x");
      this.rightForearmMatrix = translateMat(this.rightForearmMatrix, -xTranslate, -yTranslate, -zTranslate);
      this.rightForearmMatrix = multMat(rightForearmMatrix, this.rightForearmMatrix);

      var matrix = multMat(this.rightForearmMatrix, this.rightForearmInitMatrix);
      matrix = multMat(this.torsoMatrix, matrix);
      matrix = multMat(this.torsoInitialMatrix, matrix);
      this.rightForearm.setMatrix(matrix);
    }
    else if(this.rightForearmXAngle <= 0 && angle > 0) {
      this.rightForearmXAngle  += angle;
      var rightForearmMatrix = this.rightForearmMatrix;
      console.log(this.rightForearmXAngle.toString());

      // Right forearm y rotation
      this.rightForearmMatrix = idMat4();
      this.rightForearmMatrix = translateMat(this.rightForearmMatrix, xTranslate, yTranslate, zTranslate);
      this.rightForearmMatrix = rotateMat(this.rightForearmMatrix, angle, "x");
      this.rightForearmMatrix = translateMat(this.rightForearmMatrix, -xTranslate, -yTranslate, -zTranslate);
      this.rightForearmMatrix = multMat(rightForearmMatrix, this.rightForearmMatrix);

      var matrix2 = multMat(this.rightForearmMatrix, this.rightForearmInitMatrix);
      matrix2 = multMat(this.torsoMatrix, matrix2);
      matrix2 = multMat(this.torsoInitialMatrix, matrix2);
      this.rightForearm.setMatrix(matrix2);
    }
  }

  xRotateLeftForearm(angle){
    var xTranslate = 0.5;
    var yTranslate = 0.5;
    var zTranslate = 0;

    if(this.leftForearmXAngle > -2 && angle < 0) {
      this.leftForearmXAngle += angle;
      if (this.leftForearmXAngle < -2.1) {
        this.leftForearmXAngle = 0;
      }

      var leftForearmMatrix = this.leftForearmMatrix;
      console.log("x= " + this.leftForearmXAngle.toString());

      // Left forearm y rotation
      this.leftForearmMatrix = idMat4();
      this.leftForearmMatrix = translateMat(this.leftForearmMatrix, -xTranslate, yTranslate, -zTranslate);
      this.leftForearmMatrix = rotateMat(this.leftForearmMatrix, angle, "x");
      this.leftForearmMatrix = translateMat(this.leftForearmMatrix, xTranslate, -yTranslate, zTranslate);
      this.leftForearmMatrix = multMat(leftForearmMatrix, this.leftForearmMatrix);

      var matrix = multMat(this.leftForearmMatrix, this.leftForearmInitMatrix);
      matrix = multMat(this.torsoMatrix, matrix);
      matrix = multMat(this.torsoInitialMatrix, matrix);
      this.leftForearm.setMatrix(matrix);
    }
    else if(this.leftForearmXAngle < 0 && angle > 0) {
      this.leftForearmXAngle += angle;

      var leftForearmMatrix = this.leftForearmMatrix;
      console.log("x= " + this.leftForearmXAngle.toString());

      // Left forearm y rotation
      this.leftForearmMatrix = idMat4();
      this.leftForearmMatrix = translateMat(this.leftForearmMatrix, -xTranslate, yTranslate, -zTranslate);
      this.leftForearmMatrix = rotateMat(this.leftForearmMatrix, angle, "x");
      this.leftForearmMatrix = translateMat(this.leftForearmMatrix, xTranslate, -yTranslate, zTranslate);
      this.leftForearmMatrix = multMat(leftForearmMatrix, this.leftForearmMatrix);

      var matrix2 = multMat(this.leftForearmMatrix, this.leftForearmInitMatrix);
      matrix2 = multMat(this.torsoMatrix, matrix2);
      matrix2 = multMat(this.torsoInitialMatrix, matrix2);
      this.leftForearm.setMatrix(matrix2);
    }
  }

  xRotateLeftThigh(angle){
    var xTranslate = 0.5;
    var yTranslate = 0.8;
    var zTranslate = 0;

  
    if(this.leftThighXAngle >= -1.7 && angle < 0) {
      this.leftThighXAngle += angle;
      if (this.leftThighXAngle < -1.8) {
        this.leftThighXAngle = 0;
      }

      var leftThighMatrix = this.leftThighMatrix;
      var leftLegMatrix = this.leftLegMatrix;
      console.log("x= " + this.leftThighXAngle.toString() + " up motion");
      console.log(angle)

      // Left Thigh x rotation
      this.leftThighMatrix = idMat4();
      this.leftThighMatrix = translateMat(this.leftThighMatrix, -xTranslate, yTranslate, -zTranslate);      
      this.leftThighMatrix = rotateMat(this.leftThighMatrix, angle, "x");
      this.leftThighMatrix = translateMat(this.leftThighMatrix, xTranslate, -yTranslate, zTranslate);
      this.leftThighMatrix = multMat(leftThighMatrix, this.leftThighMatrix);

      var matrix = multMat(this.leftThighMatrix, this.leftThighInitMatrix);
      matrix = multMat(this.torsoMatrix, matrix);
      matrix = multMat(this.torsoInitialMatrix, matrix);
      this.leftThigh.setMatrix(matrix)

      //Left Leg x rotation
      this.leftLegMatrix = idMat4();
      this.leftLegMatrix = translateMat(this.leftLegMatrix, -xTranslate, yTranslate , zTranslate);
      this.leftLegMatrix = rotateMat(this.leftLegMatrix, angle, "x");
      this.leftLegMatrix = translateMat(this.leftLegMatrix, xTranslate, -yTranslate , -zTranslate);
      this.leftLegMatrix = multMat(leftLegMatrix, this.leftLegMatrix);

      var matrix2 = multMat(this.leftLegMatrix, this.leftLegInitMatrix);
      matrix2 = multMat(this.torsoMatrix, matrix2);
      matrix2 = multMat(this.torsoInitialMatrix, matrix2);
      this.leftLeg.setMatrix(matrix2);
    }

    else if(this.leftThighXAngle < 0 && angle > 0) {
      this.leftThighXAngle += angle;

      var leftThighMatrix = this.leftThighMatrix;
      var leftLegMatrix = this.leftLegMatrix;
      console.log("x= " + this.leftThighXAngle.toString() + " down motion");
      console.log(angle)

      // Left Thigh x rotation
      this.leftThighMatrix = idMat4();
      this.leftThighMatrix = translateMat(this.leftThighMatrix, -xTranslate, yTranslate, -zTranslate);
      this.leftThighMatrix = rotateMat(this.leftThighMatrix, angle, "x");
      this.leftThighMatrix = translateMat(this.leftThighMatrix, xTranslate, -yTranslate, zTranslate);
      this.leftThighMatrix = multMat(leftThighMatrix, this.leftThighMatrix);

      console.log("here")
      var matrix = multMat(this.leftThighMatrix, this.leftThighInitMatrix);
      matrix = multMat(this.torsoMatrix, matrix);
      matrix = multMat(this.torsoInitialMatrix, matrix);
      this.leftThigh.setMatrix(matrix);

      //Left leg x rotation
      this.leftLegMatrix = idMat4();
      this.leftLegMatrix = translateMat(this.leftLegMatrix, -xTranslate, yTranslate, zTranslate);
      this.leftLegMatrix = rotateMat(this.leftLegMatrix, angle, "x");
      this.leftLegMatrix = translateMat(this.leftLegMatrix, xTranslate, -yTranslate, -zTranslate);
      this.leftLegMatrix = multMat(leftLegMatrix, this.leftLegMatrix);

      var matrix2 = multMat(this.leftLegMatrix, this.leftLegInitMatrix);
      matrix2 = multMat(this.torsoMatrix, matrix2);
      matrix2 = multMat(this.torsoInitialMatrix, matrix2);
      this.leftLeg.setMatrix(matrix2);
    }
  }

  xRotateRightThigh(angle){
    var xTranslate = 0.5;
    var yTranslate = 0.8;
    var zTranslate = 0;

  
    if(this.rightThighXAngle >= -1.7 && angle < 0) {
      this.rightThighXAngle += angle;
      if (this.rightThighXAngle < -1.8) {
        this.rightThighXAngle = 0;
      }

      var rightThighMatrix = this.rightThighMatrix;
      var rightLegMatrix = this.rightLegMatrix;
      console.log("x= " + this.rightThighXAngle.toString() + " up motion");
      console.log(angle)

      // Right Thigh x rotation
      this.rightThighMatrix = idMat4();
      this.rightThighMatrix = translateMat(this.rightThighMatrix, -xTranslate, yTranslate, -zTranslate);
      this.rightThighMatrix = rotateMat(this.rightThighMatrix, angle, "x");
      this.rightThighMatrix = translateMat(this.rightThighMatrix, xTranslate, -yTranslate, zTranslate);
      this.rightThighMatrix = multMat(rightThighMatrix, this.rightThighMatrix);

      var matrix = multMat(this.rightThighMatrix, this.rightThighInitMatrix);
      matrix = multMat(this.torsoMatrix, matrix);
      matrix = multMat(this.torsoInitialMatrix, matrix);
      this.rightThigh.setMatrix(matrix);

      //Right Leg x rotation
      this.rightLegMatrix = idMat4();
      this.rightLegMatrix = translateMat(this.rightLegMatrix, -xTranslate, yTranslate , zTranslate);
      this.rightLegMatrix = rotateMat(this.rightLegMatrix, angle, "x");
      this.rightLegMatrix = translateMat(this.rightLegMatrix, xTranslate, -yTranslate , -zTranslate);
      this.rightLegMatrix = multMat(rightLegMatrix, this.rightLegMatrix);

      var matrix2 = multMat(this.rightLegMatrix, this.rightLegInitMatrix);
      matrix2 = multMat(this.torsoMatrix, matrix2);
      matrix2 = multMat(this.torsoInitialMatrix, matrix2);
      this.rightLeg.setMatrix(matrix2);
    }
    else if(this.rightThighXAngle < 0 && angle > 0) {
      this.rightThighXAngle += angle;

      var rightThighMatrix = this.rightThighMatrix;
      var rightLegMatrix = this.rightLegMatrix;
      console.log("x= " + this.rightThighXAngle.toString() + " down motion");
      console.log(angle)

      // Right Thigh x rotation
      this.rightThighMatrix = idMat4();
      this.rightThighMatrix = translateMat(this.rightThighMatrix, -xTranslate, yTranslate, -zTranslate);
      this.rightThighMatrix = rotateMat(this.rightThighMatrix, angle, "x");
      this.rightThighMatrix = translateMat(this.rightThighMatrix, xTranslate, -yTranslate, zTranslate);
      this.rightThighMatrix = multMat(rightThighMatrix, this.rightThighMatrix);

      var matrix2 = multMat(this.rightThighMatrix, this.rightThighInitMatrix);
      matrix2 = multMat(this.torsoMatrix, matrix2);
      matrix2 = multMat(this.torsoInitialMatrix, matrix2);
      this.rightThigh.setMatrix(matrix2);

      //Right leg x rotation
      this.rightLegMatrix = idMat4();
      this.rightLegMatrix = translateMat(this.rightLegMatrix, -xTranslate, yTranslate, zTranslate);
      this.rightLegMatrix = rotateMat(this.rightLegMatrix, angle, "x");
      this.rightLegMatrix = translateMat(this.rightLegMatrix, xTranslate, -yTranslate, -zTranslate);
      this.rightLegMatrix = multMat(rightLegMatrix, this.rightLegMatrix);

      var matrix2 = multMat(this.rightLegMatrix, this.rightLegInitMatrix);
      matrix2 = multMat(this.torsoMatrix, matrix2);
      matrix2 = multMat(this.torsoInitialMatrix, matrix2);
      this.rightLeg.setMatrix(matrix2);
      
    }
  }

  xRotateLeftLeg(angle){
    var xTranslate = 0.5;
    var yTranslate = 0.5;
    var zTranslate = 0;

    if(this.leftLegXAngle > -2 && angle < 0) {
      this.leftLegXAngle += angle;
      if (this.leftLegXAngle < -2.1) {
        this.leftLegXAngle = 0;
      }
      var leftLegMatrix = this.leftLegMatrix;
      console.log("x= " + this.leftLegXAngle.toString());

      // Left Leg x rotation
      this.leftLegMatrix = idMat4();
      this.leftLegMatrix = translateMat(this.leftLegMatrix, -xTranslate, yTranslate, -zTranslate);
      this.leftLegMatrix = rotateMat(this.leftLegMatrix, angle, "x");
      this.leftLegMatrix = translateMat(this.leftLegMatrix, xTranslate, -yTranslate, zTranslate);
      this.leftLegMatrix = multMat(leftLegMatrix, this.leftLegMatrix);

      var matrix = multMat(this.leftLegMatrix, this.leftLegInitMatrix);
      matrix = multMat(this.torsoMatrix, matrix);
      matrix = multMat(this.torsoInitialMatrix, matrix);
      this.leftLeg.setMatrix(matrix);
    }
  }
}

var robot = new Robot();

// LISTEN TO KEYBOARD
var keyboard = new THREEx.KeyboardState();

var selectedRobotComponent = 0;
var components = [
  "Torso",
  "Head",
  "RightForearm",
  "RightArm",
  "LeftArm",
  "LeftForearm",
  "LeftThigh",
  "RightThigh",
  "LeftLeg",
  "RightLeg"
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
      case "RightArm":
        robot.xRotateRightArm(-0.1);
        break;
      case "LeftArm":
        robot.xRotateLeftArm(-0.1);
        break;
      case "RightForearm":
        robot.xRotateRightForearm(-0.1);
        break;
      case "LeftForearm":
        robot.xRotateLeftForearm(-0.1);
        break;
      case "LeftThigh" :
        robot.xRotateLeftThigh(-0.1)
        break
      case  "RightThigh":
        robot.xRotateRightThigh(-0.1)
        break
      case   "LeftLeg" :
        robot.xRotateLeftLeg(-0.1)
        break
      case  "RightLeg" :
        robot.xRotateRightLeg(-0.1)
        break
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
      case "RightArm":
        robot.xRotateRightArm(0.1);
        break;
      case "LeftArm":
        robot.xRotateLeftArm(0.1);
        break;
      case "RightForearm":
        robot.xRotateRightForearm(0.1);
        break;
      case "LeftForearm":
        robot.xRotateLeftForearm(0.1);
        break;
      case "LeftThigh" :
        robot.xRotateLeftThigh(0.1)
        break
      case  "RightThigh":
        robot.xRotateRightThigh(0.1)
        break
      case   "LeftLeg" :
        robot.xRotateLeftLeg(0.1)
        break
      case  "RightLeg" :
        robot.xRotateRightLeg(0.1)
        break
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
      case "RightArm":
        robot.zRotateRightArm(-0.1);
        break;
      case "LeftArm":
        robot.zRotateLeftArm(-0.1);
        break;
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
        robot.zRotateRightArm(0.1);
        break;
      case "LeftArm":
        robot.zRotateLeftArm(0.1);
        break;
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