
//import {test} from "./actors.js"


var canvas = document.getElementById("renderCanvas");

var engine = null;
var scene = null;
var ground=null;
var player=null;

var sceneToRender = null;
var createDefaultEngine = function() { 
    return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true,  disableWebGL2Support: false});
};


//
var pi=Math.PI

//gameplay stats
var PLAYERMOVE=false
var DEBUG=true

//player stats
var playerWidth=0.75
var wheelWidth=0.5

var attackSpeed = 300
var rotationSpeed = Math.PI / 150


var bulletRange = 15000;
var bulletSpeed = Math.PI / 100;
bulletSpeed /= 3;
var bulletHeight = 1;
var bulletCount = 1;
var bulletAngleOffset = pi/12;
var bulletHorizOffset = 0.5;


//other stats
var planetDiameter = 6
var planetRadius=planetDiameter/2
//assets
const assets = {
    assetMeshes : new Map(),
}

const assetsPath= [

    "rocketTest.babylon",
    //"grass.babylon"

]

//data
var bullets = []
var collidingObjects=[]
var enemies=[]



//get a random position on surface of sphere
function randomPos(radius){
    var x = Math.random()
    x *= Math.round(Math.random()) ? 1 : -1
    var y = Math.random()
    y *= Math.round(Math.random()) ? 1 : -1
    var z = Math.random()
    z *= Math.round(Math.random()) ? 1 : -1
    var num = x * x + y * y + z * z
    if (num == 0) {
        x = 0
        y = 0
        z = 0
    }
    else {
        x *= 1 / Math.sqrt(num)
        y *= 1 / Math.sqrt(num)
        z *= 1 / Math.sqrt(num)
        x = (x * radius)
        y = (y * radius)
        z = (z * radius)
    }
    return new BABYLON.Vector3(x,y,z)
}

//orient object in right direction
function orientSurface(object,position,ground) {
    var directionPoint=position
    directionPoint.normalize()
    var yaxis = directionPoint;
    var xaxis = BABYLON.Vector3.Cross(BABYLON.Axis.Y, yaxis);
    var zaxis = BABYLON.Vector3.Cross(xaxis, yaxis);
    //half of height
    var objHeight=object.getBoundingInfo().boundingBox.extendSize;
    
    object.position = ground.position.add(directionPoint.scale(planetRadius + objHeight.y ));
   
    BABYLON.Vector3.RotationFromAxisToRef(xaxis, yaxis, zaxis, object.rotation);
}

//uniformly distribute something on planet
function uniformlyDistribute(mesh,ground,density=0.5,collisions=false,scene){
    
    objects=[]
    for (var i = 0; i < 100; i++) {
        if(Math.random()<density){
            obj=mesh.createInstance()         
            var scale = 1 + Math.random() * 2;
            //point on surface of sphere
            var position=randomPos(planetDiameter/2)
            obj.position = position
            orientSurface(obj,position,ground)

            obj.parent = ground;
            objects.push(obj)
   
            if(collisions) {
                obj.checkCollisions=true
            }
        }
        
    }

    if(collisions) collidingObjects.push(objects)
    return objects
}


//create a bullet
// count = number of projectiles
function createBullet(mesh,count,shooter,ground,mode="parallel",scene) {
    
    const currentTime = new Date().getTime();

    //get width of bullet
    bulletHorizOffset==mesh.getBoundingInfo().boundingBox.extendSize.x;

    var dir;
    
    if(mode=="arc") dir=shooter.rotation.z - ((bulletCount-1)/2 * bulletAngleOffset)
    else if(mode=="parallel") {
        dir=shooter.rotation.z
        var horizPosition=-(bulletCount-1)/2 * bulletHorizOffset
    }

    projectiles=[]
    for(var i=0;i<count;i++){
        
        var projectile = {}
        
        //var bullet = BABYLON.Mesh.CreateSphere(`${currentTime}bullet${i}`, 16, .5, scene);
        var pivot;
        if(DEBUG) pivot = BABYLON.Mesh.CreateCapsule(`${currentTime}pivot${i}`, { radiusTop: 0.05 }, scene); // capsule is visible for debug
        else pivot=new BABYLON.TransformNode(`${currentTime}pivot${i}`) // transformNode is invisible
        //get instance from pre-loaded model
        var bullet=mesh.createInstance()
        bullet.scaling=new BABYLON.Vector3(0.15,0.15,0.15)
        //var bullet = BABYLON.Mesh.CreateCapsule(`${currentTime}bullet${i}`, { radiusTop: 0.1 }, scene);
        var shooterPos=shooter.getAbsolutePosition()
        bullet.position = shooterPos

        //bullet.rotation.y=90
        // dir is the direction of the cannon basically
        bullet.rotation.z= dir
        pivot.rotation.z = dir

        bullet.setParent(pivot)
        pivot.setParent(ground)

        projectile["axis"] = new BABYLON.Vector3(dir, 0, 0)
        projectile["direction"] = dir > 0 ? 1 : -1



        //slightly higher in order to not collide with ground immediately
        bullet.locallyTranslate(new BABYLON.Vector3(0, 0, -bulletHeight));
        bullet.locallyTranslate(new BABYLON.Vector3(0, 1.5, 0));
        if(mode=="parallel") bullet.locallyTranslate(new BABYLON.Vector3(horizPosition, 0, 0));

        bullet.material = new BABYLON.StandardMaterial("bulletmat", scene);
        bullet.checkCollisions = true;    
        bullet.showBoundingBox = true;
    
        projectile["bullet"]=bullet
        projectile["pivot"]=pivot
        

        projectiles.push(projectile)

        if(mode=="arc") dir+=bulletAngleOffset
        horizPosition+=bulletHorizOffset
        
    }
    return projectiles
}

//rotate obj from A to B
function rotateTowards(obj,A,B){
    var direction=B.position.subtract(A.position)
    obj.rotation=direction

    //const target = enemyDir;
    obj.lookAt(direction)
    obj.rotate(new BABYLON.Vector3(1, 0 ,0), Math.PI/2);
}

//create enemy
function createEnemy(mesh,position) {
    const currentTime = new Date().getTime();

    var enemyDict = {}
    var enemy=mesh.createInstance()
    enemy.position=position
    enemy.visibility=0.4
    var enemyDir= player.position.subtract(enemy.position)
    var enemyPivot;
    if(DEBUG) enemyPivot = BABYLON.Mesh.CreateCapsule(`enemyPivot`, { radiusTop: 0.05 }, scene);
    else enemyPivot=new BABYLON.TransformNode(`${currentTime}enemyPivot`)
    //var enemyPivot=new BABYLON.TransformNode(`${currentTime}enemyPivot`)
    
    rotateTowards(enemyPivot,enemy,player)

    orientSurface(enemy,position,ground)

    enemy.setParent(enemyPivot)
    enemyPivot.setParent(ground)

    enemyDict["enemy"]=enemy
    enemyDict["pivot"]=enemyPivot

    return enemyDict 
}

//
//---------------CREATE SCENE-----------
//

var createScene = function () {

console.log("starting")
var scene = new BABYLON.Scene(engine);
scene.collisionsEnabled = true;
//arc rotate camera is a type of camera that orbit the target.

var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI/2, 1.2, 10, new BABYLON.Vector3(0, 0, 0), scene);

//mainly for debug, control rotation of camera with mouse
camera.attachControl()

var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
light.intensity = 0.7;

//Creating the (temporary) player
player = BABYLON.MeshBuilder.CreateBox("player", { size: 1, width: playerWidth,segments: 32 }, scene);
var playerPivot = new BABYLON.TransformNode("root");
player.setParent(playerPivot)
if(PLAYERMOVE) camera.parent=playerPivot

var wheelR=BABYLON.MeshBuilder.CreateBox("playerWheelR", {size: 0.8, width: wheelWidth }, scene);
wheelR.parent=player
wheelR.position.x=playerWidth/2+wheelWidth/2

var wheelL=BABYLON.MeshBuilder.CreateBox("playerWheelL", {size: 0.8,width: wheelWidth  }, scene);
wheelL.parent=player
wheelL.position.x=-(playerWidth/2+wheelWidth/2)

//creating the planet
ground  = BABYLON.MeshBuilder.CreateSphere("ground", { diameter: planetDiameter, segments: 32 }, scene);
var planetMaterial = new BABYLON.StandardMaterial("planetMat", scene);
var grassTexture=new BABYLON.Texture("grass.jpg", scene);
grassTexture.uScale=20
grassTexture.vScale=10
planetMaterial.diffuseTexture = grassTexture
ground.material=planetMaterial

player.scaling=new BABYLON.Vector3(0.4,0.4,0.4)
player.position.z = -planetDiameter / 2;


//some debug utilities
if(DEBUG) {
    //ground.showBoundingBox = true
    ground.visibility = 0.3
    player.visibility = 0.8
}

//------------LOAD ASSETS--------------
var currentTime=new Date().getTime()

console.log("Loading assets...")

var assetsManager = new BABYLON.AssetsManager(scene);
assetsPath.forEach(asset => {
    
    const name='load '+asset
    const path='./'
    const meshTask = assetsManager.addMeshTask(name, "", path, asset)
    console.log("loading : "+ asset)
    
    
    meshTask.onSuccess = (task) => {
        // disable the original mesh and store it in the data structure
        console.log('loaded and stored '+asset)
        task.loadedMeshes[0].setEnabled(false)
        assets.assetMeshes.set(asset, task.loadedMeshes[0])
        
    }
    meshTask.onError = function (task, message, exception) {
        console.log(message, exception);
    }
    
    
})
assetsManager.load();   // do all the tasks
console.log("loading has ended")



//---------POPULATE PLANET---------------
var mesh=BABYLON.MeshBuilder.CreateSphere("Rocks", {diameter: 0.2 }, scene);
mesh.setEnabled(false)
//var mesh=assets.assetMeshes.get("rocketTest.babylon")
uniformlyDistribute(mesh,ground,density=0.5,collisions=true,scene)

//CREATE ENEMIES

var mesh=BABYLON.MeshBuilder.CreateCylinder("enemy", {height: 0.1 }, scene);
//mesh.visibility=0.5
mesh.setEnabled(false)

//enemies
var numEnemies=1
for(var i=0;i<numEnemies;i++) {
    var position=randomPos(planetRadius)
    var enemy=createEnemy(mesh,position)
    enemies.push(enemy)
}





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
scene.onBeforeRenderObservable.add(() => {
if (inputMap["w"] || inputMap["ArrowUp"]) {
    wheelR.rotation.x+=0.05
    wheelL.rotation.x+=0.05
    var forward = new BABYLON.Vector3(1, 0, 0);		
    var dir = player.getDirection(forward);
    dir.normalize();
    
    if(PLAYERMOVE) playerPivot.rotate(dir, Math.PI / 150, BABYLON.Space.WORLD)  // the player moves, the planet stays still
    else ground.rotate(dir, -Math.PI / 150, BABYLON.Space.WORLD);   // the player doesn't move, the planet rotates
    
}
if (inputMap["a"] || inputMap["ArrowLeft"]) {
    wheelR.rotation.x+=0.05
    wheelL.rotation.x-=0.05
    player.rotation.z += rotationSpeed

}
if (inputMap["s"] || inputMap["ArrowDown"]) {
    wheelR.rotation.x-=0.05
    wheelL.rotation.x-=0.05

    var forward = new BABYLON.Vector3(1, 0, 0);		
    var dir = player.getDirection(forward);
    dir.normalize();
     
    if(PLAYERMOVE) playerPivot.rotate(dir, -Math.PI / 150, BABYLON.Space.WORLD)
    else ground.rotate(dir, Math.PI / 150, BABYLON.Space.WORLD);
    
}
if (inputMap["d"] || inputMap["ArrowRight"]) {
    wheelR.rotation.x-=0.05
    wheelL.rotation.x+=0.05
    player.rotation.z -= rotationSpeed
}

//shoot
const currentTime = new Date().getTime();
if (inputMap["h"] && currentTime > nextBulletTime) {

    //avoid singular case
    if (player.rotation.z == 0) player.rotation.z += 0.001
    var mesh=assets.assetMeshes.get("rocketTest.babylon")
    var projectiles=createBullet(mesh,bulletCount,player,ground,mode="arc",scene)
    // bullets is all existing bullets, projectiles is the bullets fired at once
    for(var pr=0; pr<projectiles.length;pr++) bullets.push(projectiles[pr])
    nextBulletTime = new Date().getTime() + attackSpeed;
}
})
//END OnBeforeRenderObservable i.e. input reading//




//compute bullet position and collision
scene.registerBeforeRender(function () {
//with no bullet array is empty
for (var idx = 0; idx < bullets.length; idx++) {

    var pivot = bullets[idx]["pivot"]
    var axis = bullets[idx]["axis"]
    var direction = bullets[idx]["direction"]

    var bullet = bullets[idx]["bullet"]

    bullet.locallyTranslate(new BABYLON.Vector3(0, 0, 1/bulletRange));

    pivot.rotate(axis, bulletSpeed * direction, BABYLON.Space.LOCAL);
    
    
    var bulletFall=BABYLON.Vector3.Distance(bullet.position,ground.position)<planetDiameter/2
    //bulletFall=false
    //collision with ground
    if (bulletFall) {
        bullet.material.emissiveColor = new BABYLON.Color4(1, 0, 0, 1);
        bullet.dispose()    // delete from scene
        pivot.dispose()
        bullets.splice(idx,1)   // delete from array
        
    }
    //collision with objects
    collidingObjects.forEach(objects => {
        for( var i=0; i<objects.length;i++){
            if (bullet.intersectsMesh(objects[i], false)){
                bullet.material.emissiveColor = new BABYLON.Color4(1, 0, 0, 1);
                objects[i].dispose()
                objects.splice(i,1)  
            }
        }
    })

}

});









//ENEMY ALTERNATE MOVEMENT SNIPPET
var moved=0
var nextEnemyMoveTime=new Date().getTime();
scene.registerBeforeRender(function () {
    const currentTime = new Date().getTime();
    for (var idx = 0; idx < enemies.length; idx++) {
        
        var enemyPivot=enemies[idx]["pivot"]
        var enemy=enemies[idx]["enemy"]

        var forward = new BABYLON.Vector3(0, 0, 1);		
        var direction = enemyPivot.getDirection(forward);
        direction.normalize();
        
        
        if (moved<pi/4 && currentTime>nextEnemyMoveTime) {
            enemyPivot.rotate(direction,pi/200, BABYLON.Space.WORLD);
            moved+=pi/200
        }
        else if(moved>0){
            nextEnemyMoveTime = new Date().getTime() + 300;
            moved=0
        }
    }
})








return scene;


};

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
