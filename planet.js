
//import {test} from "./actors.js"


var canvas = document.getElementById("renderCanvas");

var engine = null;
var scene = null;
var ground = null;
var player = null;

var sceneToRender = null;
var createDefaultEngine = function() { 
    return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true,  disableWebGL2Support: false});
};


//
var pi=Math.PI;

//gameplay stats
var PLAYERMOVE = false;
var DEBUG = false;

//player stats
var playerWidth = 0.75;
var wheelWidth = 0.5;

var attackSpeed = 300;
var rotationSpeed = Math.PI / 150;


var bulletRange = 15000;
var bulletSpeed = Math.PI / 100;
var bulletHeight = 1;
var bulletCount = 1;
var bulletAngleOffset = pi/12;
var bulletHorizOffset = 0.5;


var playerLife=100

//enemy stats
var numEnemies=1
//not used
var enemyShooterType=1
var enemyWalkerType=2

//other stats
var planetDiameter = 6;
var planetRadius = planetDiameter/2;

//assets
const assets = {
    assetMeshes : new Map(),
}

var playerAsset=[]

//assets needed later
const assetsPath = [
    "rocketTest.babylon",
    
    "grass2.babylon",
    "enemy.babylon",
    "grass.babylon",
]

const playerPath = [
    "playerTest.babylon",
]

//data
var bullets = [];
var collidingObjects = [];
var enemies = [];


/*
// ------- BUTTON MANAGER -------
document.addEventListener("DOMContentLoaded", function(e) {
    var buttons = document.getElementsByTagName("button");
    var spans = document.getElementsByTagName("span");
    console.log(buttons);
    console.log(spans);
    for (var butt=0; butt < buttons.length; butt++) {
        //console.log(buttons);
        buttons[butt].onclick = function() {
            console.log("clicked");
            spans[butt].classList.add("success");
            for (var span=0; span<spans.length; span++) {
                spans[span].classList.add("success");
            }
        }
    }
});
*/

//get a random position on surface of sphere
function randomPos(radius){
    var x = Math.random();
    x *= Math.round(Math.random()) ? 1 : -1;
    var y = Math.random();
    y *= Math.round(Math.random()) ? 1 : -1;
    var z = Math.random();
    z *= Math.round(Math.random()) ? 1 : -1;
    var num = x * x + y * y + z * z;
    if (num == 0) {
        x = 0;
        y = 0;
        z = 0;
    }
    else {
        x *= 1 / Math.sqrt(num);
        y *= 1 / Math.sqrt(num);
        z *= 1 / Math.sqrt(num);
        x = (x * radius);
        y = (y * radius);
        z = (z * radius);
    }
    return new BABYLON.Vector3(x,y,z);
}

//
function getPointNearPosition(p0,range){
    //random positive or negative
    var ranPos=Math.round(Math.random()) ? 1 : -1;
    var x=p0.x +(Math.random()*range*ranPos)
    var y=p0.y +(Math.random()*range*ranPos)
    var z=p0.z +(Math.random()*range*ranPos)

    var pos=new BABYLON.Vector3(x,y,z)
    var dir=pos
    dir.normalize()
    var ret=dir.scale(planetRadius)
    //check if point is on surface
    //console.log((ret.x*ret.x +ret.y*ret.y +ret.z*ret.z)==planetRadius*planetRadius)
    return ret

}

//orient object in right direction
function orientSurface(object,position,ground) {
    var directionPoint = position;
    directionPoint.normalize();
    var yaxis = directionPoint;
    var xaxis = BABYLON.Vector3.Cross(BABYLON.Axis.Y, yaxis);
    var zaxis = BABYLON.Vector3.Cross(xaxis, yaxis);
    //half of height
    var objHeight = object.getBoundingInfo().boundingBox.extendSize;
    
    object.position = ground.position.add(directionPoint.scale(planetRadius));
   
    BABYLON.Vector3.RotationFromAxisToRef(xaxis, yaxis, zaxis, object.rotation);
}

function getGlobalRotation(obj){
    var scale = new BABYLON.Vector3(0, 0, 0);
    var rotation = new BABYLON.Quaternion();
    var translation = new BABYLON.Vector3(0,0,0);

    var tempWorldMatrix = obj.getWorldMatrix();
    tempWorldMatrix.decompose(scale, rotation, translation);
    return rotation;

}
//uniformly distribute something on planet
function uniformlyDistribute(mesh,ground,density=0.5,collisions=false,scene){
    
    objects = [];
    for (var i = 0; i < 100; i++) {
        if (Math.random()<density) {
            obj = mesh.createInstance();        
            var scale = 1 + Math.random() * 2;
            //point on surface of sphere
            var position = randomPos(planetDiameter/2);
            obj.position = position;
            orientSurface(obj,position,ground);

            obj.parent = ground;
            objects.push(obj);
   
            if(collisions) {
                obj.checkCollisions = true;
            }
        }
        
    }

    if (collisions) collidingObjects.push(objects);
    return objects;
}

function bulletGen(mesh,bulletCount=1,shooter=null,ground,
    mode="parallel",bulletAngleOffset=bulletAngleOffset,bulletHorizOffset=0.5,
    range=bulletRange, speed=bulletSpeed,scene) {

    bulletHorizOffset = mesh.getBoundingInfo().boundingBox.extendSize.x*1.1;

    var dir;
    var playerRot=getGlobalRotation(player).toEulerAngles()
    if (mode=="arc") dir = playerRot.z - ((bulletCount-1)/2 * bulletAngleOffset);
    else if (mode=="parallel") {
        dir=playerRot.z;
        var horizPosition = -(bulletCount-1)/2 * bulletHorizOffset;
    }

    projectiles = [];
    var bullet;
    for (var i=0;i<bulletCount;i++) {
        bullet=new Bullet(mesh,shooter,ground,scene)
        bullet.spawn(dir)
        /*
        bullet.bulletSpeed=speed
        bullet.bulletRange=range
        */
        projectiles.push(bullet);

        if(mode=="parallel") {
            bullet.bullet.locallyTranslate(new BABYLON.Vector3(horizPosition, 0, 0));
            horizPosition += bulletHorizOffset;
        }
        if (mode=="arc") dir += bulletAngleOffset;
    
    }
    return projectiles
}

//rotate obj from A to B
function rotateTowards(obj,A,B){
    //var direction = B.getAbsolutePosition().subtract(A.getAbsolutePosition());
    var direction=B.subtract(A);
    obj.rotation = direction;

    //const target = enemyDir;
    obj.lookAt(direction);
    obj.rotate(new BABYLON.Vector3(1, 0 ,0), Math.PI/2);
}

function createEnemies(light){   
    //CREATE ENEMIES
    //var mesh = BABYLON.MeshBuilder.CreateCylinder("enemy", {height: 0.1 }, scene);

    //mesh.visibility=0.5
    var mesh=assets.assetMeshes.get("enemy.babylon");
    mesh.scaling=new BABYLON.Vector3(0.4,0.4,0.4)
    console.log(mesh.material)

    
    for(var i=0;i<numEnemies;i++) {
        var position=randomPos(planetRadius)
        var enemyBullet=assets.assetMeshes.get("rocketTest.babylon");
        //taret is player with some randomness
        var target=player
        var enemy=new Enemy(mesh,ground,target,enemyBullet,enemyShooterType,DEBUG,scene)
        enemy.spawn(position, light);
        enemy.enemy.locallyTranslate(new BABYLON.Vector3(0, 0.5, 0))
        enemies.push(enemy)
    }
}


//to stop animation scene.stopAnimation(newMeshes[0])
function walk(side="right",direction){
    var frameRate=60
    var speed=4
    var step=frameRate/speed
    var lowerLeg;
    var upperLeg;
    if(side=="right" || side=="R"){
        lowerLeg=playerAsset[4]
        upperLeg=playerAsset[2]
    }
    else {
        lowerLeg=playerAsset[5]
        upperLeg=playerAsset[3]
    }
    var currentRot=lowerLeg.rotation.x
    
    var walkLower = new BABYLON.Animation("walkDown", "rotation.x",
     frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var keyFrames = []; 

    keyFrames.push({
        frame: 0,
        value: currentRot
    });

    keyFrames.push({
        frame: step,
        value: currentRot-(pi/4*direction)
    });
    
    keyFrames.push({
        frame: step*2,
        value: currentRot+(pi/2*direction)
    });
    
    keyFrames.push({
        frame: 3 * step,
        value: currentRot
    });

    walkLower.setKeys(keyFrames);
    scene.beginDirectAnimation(lowerLeg, [walkLower], 0,  keyFrames.length*step, true);
    
    
    var walkUpper = new BABYLON.Animation("walkUp", "rotation.x", 
        frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var keyFrames = []; 
    var currentRot=upperLeg.rotation.x
    keyFrames.push({
        frame: 0,
        value: currentRot
    });

    keyFrames.push({
        frame: step,
        value: currentRot+(pi/6*direction)
    });
    
    keyFrames.push({
        frame: step*2,
        value: currentRot-(pi/2*direction)
    });
    
    keyFrames.push({
        frame: 3 * step,
        value: currentRot
    });

    walkUpper.setKeys(keyFrames);

    
    scene.beginDirectAnimation(upperLeg, [walkUpper], 0,  keyFrames.length* step, true);
    
}


function endLevel() {
    console.log("endLevel called");
   document.getElementById("congrats").classList.add("anim-first");
   document.getElementById("message").classList.add("anim-first");
   document.getElementById("container").classList.add("anim-container");
   document.getElementById("upgrade").classList.add("anim-upgrade");
   document.getElementById("renderCanvas").classList.add("anim-canvas");
}   

//
//----------------MAIN LOOP--------------------
//
function main(){
    
var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI/2, 1.2, 10, new BABYLON.Vector3(0, 0, 0), scene);

//mainly for debug, control rotation of camera with mouse
camera.attachControl();

var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
light.intensity = 0.7;




player=playerAsset[1]

player.position.z = -planetDiameter / 2;
var playerPivot = new BABYLON.TransformNode("root");
player.parent=playerPivot
//playerPivot.rotate(BABYLON.Axis.X,-pi/2,BABYLON.Space.LOCAL)


//creating the planet
ground = BABYLON.MeshBuilder.CreateSphere("ground", { diameter: planetDiameter, segments: 32 }, scene);
var planetMaterial = new BABYLON.StandardMaterial("planetMat", scene);
var grassTexture = new BABYLON.Texture("grass.jpg", scene);
grassTexture.uScale = 20;
grassTexture.vScale = 10;
planetMaterial.diffuseTexture = grassTexture;
ground.material = planetMaterial;



// to avoid that the scaling influences also its children (i.e. the health bar)
//player.bakeCurrentTransformIntoVertices();
//player.position.z = -planetDiameter / 2;
//console.log(player.getAbsolutePosition())


//this is useful to see which player asset correspond to what
/*
scene.registerBeforeRender(function () {
    //playerAsset[0].rotation.z+=0.01
})
*/

//some debug utilities
if (DEBUG) {
    //ground.showBoundingBox = true
    ground.visibility = 0.3;
    //player.visibility = 0.8;
}


//---------POPULATE PLANET---------------
var mesh=assets.assetMeshes.get("grass.babylon")
uniformlyDistribute(mesh,ground,density=0.5,collisions=true,scene);
createEnemies(light);

// ------------ SHOW UI -----------------

var playerHealth = new HealthBar(player, light, scene, false);

//------------INPUT READING--------------

var inputMap = {};
scene.actionManager = new BABYLON.ActionManager(scene);
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
}));
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
}));


let nextBulletTime = new Date().getTime();
// do the following every time before rendering a frame

var positionUpdated=false
var rotatingLeft=false
var rotatingLeft=false

scene.onBeforeRenderObservable.add(() => {

if (inputMap["w"] || inputMap["ArrowUp"]) {
    //wheelR.rotation.x += 0.05;
    //wheelL.rotation.x += 0.05;
    var forward = new BABYLON.Vector3(1, 0, 0);		
    var dir = player.getDirection(forward);
    dir.normalize();
    
    if (PLAYERMOVE) playerPivot.rotate(dir, Math.PI / 150, BABYLON.Space.WORLD);  // the player moves, the planet stays still
    else ground.rotate(dir, -Math.PI / 150, BABYLON.Space.WORLD);   // the player doesn't move, the planet rotates
    positionUpdated=true
}
if (inputMap["a"] || inputMap["ArrowLeft"]) {
    //wheelR.rotation.x += 0.05;
    //wheelL.rotation.x -= 0.05;
    player.rotation.z += rotationSpeed;
    if(!rotatingLeft) {
        walk("R",1)
        rotatingLeft=true
    }    
}
if (inputMap["s"] || inputMap["ArrowDown"]) {
    //wheelR.rotation.x -= 0.05;
    //wheelL.rotation.x -= 0.05;

    var forward = new BABYLON.Vector3(1, 0, 0);		
    var dir = player.getDirection(forward);
    dir.normalize();
     
    if (PLAYERMOVE) playerPivot.rotate(dir, -Math.PI / 150, BABYLON.Space.WORLD);
    else ground.rotate(dir, Math.PI / 150, BABYLON.Space.WORLD);
    positionUpdated=true
    
}
if (inputMap["d"] || inputMap["ArrowRight"]) {
    //wheelR.rotation.x -= 0.05;
    //wheelL.rotation.x += 0.05;
    player.rotation.z -= rotationSpeed;
    
}

//try to stop animation when button not pressed
else if(!(inputMap["a"] || inputMap["d"]))
    for(var i=0;i<playerAsset.length;i++)
        scene.stopAnimation(playerAsset[i])

//shoot
const currentTime = new Date().getTime();
if (inputMap["h"] && currentTime > nextBulletTime) {
    
    //avoid singular case
    if (player.rotation.z == 0) player.rotation.z += 0.001;
    var mesh=assets.assetMeshes.get("rocketTest.babylon");
    var projectiles=bulletGen(mesh,bulletCount,player,ground,
        "parallel",bulletAngleOffset,bulletHorizOffset,scene)
    // bullets is all existing bullets, projectiles is the bullets fired at once
    for (var pr=0; pr<projectiles.length;pr++) bullets.push(projectiles[pr]);
    nextBulletTime = new Date().getTime() + attackSpeed;
}
})
//END OnBeforeRenderObservable i.e. input reading//

//compute bullet position and collision
scene.registerBeforeRender(function () {
//with no bullet array is empty
for (var idx = 0; idx < bullets.length; idx++) {

    var bullet = bullets[idx];
    var pivot=bullet.pivot
    var bulletMesh=bullet.bullet
    bullet.move()

    
    var bulletFall = BABYLON.Vector3.Distance(bulletMesh.position,ground.position) < planetDiameter/2;
    //bulletFall=false
    //collision with ground
    
    if (bulletFall) {
        bulletMesh.material.emissiveColor = new BABYLON.Color4(1, 0, 0, 1);
        bulletMesh.dispose();    // delete from scene
        pivot.dispose();
        bullets.splice(idx,1);   // delete from array
        
    }
    //collision bullet objects
    collidingObjects.forEach(objects => {
        for( var i=0; i<objects.length;i++){
            if (bulletMesh.intersectsMesh(objects[i], false)){
                bulletMesh.material.emissiveColor = new BABYLON.Color4(1, 0, 0, 1);
                objects[i].dispose();
                objects.splice(i,1);  
            }
        }
    })
    
    //collision bullet-enemies
    for (let j=0; j<enemies.length; j++) {
            if (bulletMesh.intersectsMesh(enemies[j].enemy, false)) {
                console.log("enemy hit");
                dead=enemies[j].whenHit(bullet.damage);
                if (dead) enemies.splice(j, 1);
                bulletMesh.dispose();
                pivot.dispose();
                bullets.splice(idx, 1);

                if (enemies.length == 0) {
                    console.log("all enemies dead");
                    endLevel();
                }
            }
    }

}

});

//Move enemies
scene.registerBeforeRender(function () {   
    for (var idx = 0; idx < enemies.length; idx++) {
        
        enemies[idx].moveStep()
        if(positionUpdated) {
            enemies[idx].updatePosition()
        }
    }
    positionUpdated=false
})

}//END MAIN

//Asset loading and start
var createScene = function () {

console.log("starting");
scene = new BABYLON.Scene(engine);
//scene.debugLayer.show();
scene.collisionsEnabled = true;
//arc rotate camera is a type of camera that orbit the target.
console.log("Loading assets...");
//console.log(assets);

var assetsManager = new BABYLON.AssetsManager(scene);

// Loading assets that don't need to appear immediately
assetsPath.forEach(asset => {
    
    const name='load '+asset;
    const path='./';
    const meshTask = assetsManager.addMeshTask(name, "", path, asset);
    console.log("loading : "+ asset);
    
    meshTask.onSuccess = (task) => {
        // disable the original mesh and store it in the data structure
        console.log('loaded and stored '+asset);
        //for is needed if multiple meshes in same object 
        task.loadedMeshes[0].setEnabled(false);
        assets.assetMeshes.set(asset, task.loadedMeshes[0]);
    }
    meshTask.onError = function (task, message, exception) {
        console.log(message, exception);
    }
});

playerPath.forEach(asset => {
    
    const name='load '+asset;
    const path='./';
    const meshTask = assetsManager.addMeshTask(name, "", path, asset);
    console.log("loading : "+ asset);
    
    meshTask.onSuccess = (task) => {
        // disable the original mesh and store it in the data structure
        console.log('loaded and stored '+asset);
        //for is needed if multiple meshes in same object 
        for(var i=0; i< task.loadedMeshes.length; i++) {
            //task.loadedMeshes[i].setEnabled(false);
            playerAsset.push(task.loadedMeshes[i]);
        }
    }
    meshTask.onError = function (task, message, exception) {
        console.log(message, exception);
    }
});

assetsManager.onFinish = function(tasks) {
    console.log("Finished loading assets")    
    main()
};


assetsManager.load();   // do all the tasks
console.log("loading has ended");
return scene;

};
//END OF SCENE CREATION


//other things
window.initFunction = async function() {               
    var asyncEngineCreation = async function() {
        try {
        return createDefaultEngine();
        } catch(e) {
        console.log("the available createEngine function failed. Creating the default engine instead");
        return createDefaultEngine();
        }
    }
    window.engine = await asyncEngineCreation();
    if (!engine) throw 'engine should not be null.';
    window.scene = createScene();
};



initFunction().then(() => {
    //before..
    console.log("render")
    sceneToRender = scene        
    engine.runRenderLoop(function () {
        if (sceneToRender && sceneToRender.activeCamera) {
            sceneToRender.render();
        }
    });
    
});

// Resize
window.addEventListener("resize", function () {
    engine.resize();
});
