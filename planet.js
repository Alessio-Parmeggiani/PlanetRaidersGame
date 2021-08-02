
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
var framerate=60

//gameplay stats
var PLAYERMOVE = false;
var DEBUG = false;

//player stats
var playerWidth = 0.75;
var wheelWidth = 0.5;

var attackSpeed = 300;
var rotationSpeed = Math.PI / 100;


var bulletRange = 1;    // num of revolutions around the planet
var bulletSpeed = Math.PI / 100;
var bulletHeight = 1;
var bulletParallelCount = 1;
var bulletArcCount = 1;
var bulletAngleOffset = pi/12;
var bulletHorizOffset = 0.5;
var bulletMode = "parallel"


var maxPlayerLife = 100;
var playerLife = maxPlayerLife;
var bonusLife = 0;
var playerSpeed = 150;
var contactDamage = 10;
var newVulnerableTime=new Date().getTime();
//ms of invincibility after contact with enemies
var invincibleTime = 500;

//enemy stats
var enemyLife=5
var numNormalEnemies=2
var numFastEnemies=1
var numTankEnemies=1

var probTankEnemy=0
var probFastEnemy=0

var numEnemies=numNormalEnemies+numFastEnemies+numTankEnemies
var remainingEnemies=numEnemies

//duration of spawning animation
var spawnDurationTime=3000 //ms
var spawnDurationFrame=framerate*(spawnDurationTime/1000)


var enemyNormalType=1
var enemyFastType=2
var enemyTankType=3

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
    "rocket.babylon", 
    "grass2.babylon",
    "enemy.babylon",
    "enemyFast.babylon",
    "grass.babylon",
    "enemyTank.babylon"
]

const playerPath = [
    "playerTest2.babylon",
]

//data
var bullets = [];
var collidingObjects = [];
var enemies = [];
var lights=[]

// ---- Animations ----
var animating = false;
var forward = true;
var previous_forward = true;
var animations = [];

// ------- BUTTON MANAGER -------
const buttons = Array.from(document.getElementsByTagName("button"));
const congrats = document.getElementById("congrats");
const message = document.getElementById("message");
const container = document.getElementById("container");
const upgrade = document.getElementById("upgrade");
const upgradeList = document.getElementById("upgradeList");
const bar = document.getElementById("bar");
const playerHealth = document.getElementById("playerHealth");
var chosen_upgrade;

buttons.forEach(button => {
    button.onclick = function() {
        chosen_upgrade = button.getElementsByTagName("span")[0].textContent;
        const icon = document.createElement("img");
        icon.classList.add("icon");
        console.log(chosen_upgrade);
        switch (chosen_upgrade) {
            case "Player speed up":
                playerSpeed -= 50;
                icon.src = "icons/Speed up.png";
                break;
            case "Bullets +1":
                bulletParallelCount += 1;
                icon.src = "icons/Bullets +1.png";
                break;
            case "Arc bullets":
                bulletArcCount+=2;
                icon.src = "icons/Arc bullets.png";
                break;
            case "Bullets speed up":
                bulletSpeed = Math.PI / 50;
                icon.src = "icons/Bullets speed up.png";
                break;
            case "Bullets range up":
                bulletRange += 0.5;
                icon.src = "icons/Bullets range up.png";
                break;
            case "Health up":
                bonusLife = 30;
                icon.src = "icons/Health up.png";
                const moreHealth = document.createElement("div");
                moreHealth.id = "moreHealth";
                moreHealth.style.left = 30 + playerHealth.offsetWidth + "px";
                bar.appendChild(moreHealth);
                break;
        }
        congrats.classList.remove("anim-first");
        message.classList.remove("anim-first");
        container.classList.remove("anim-container");
        upgrade.classList.remove("anim-upgrade");
        canvas.classList.remove("anim-canvas");
        upgradeList.appendChild(icon);

        //numEnemies += 3;
        newLevel()
        //createEnemies(light); I can't because the light still isn't defined
    }
})

//
//----------------MAIN LOOP--------------------
//
function main(){
    
var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI/2, 1.2, 10, new BABYLON.Vector3(0, 0, 0), scene);

//mainly for debug, control rotation of camera with mouse
camera.attachControl();
camera.wheelPrecision = 45;

//var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
var light = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(-1, -1, 1), scene);
light.intensity = 0.8;
lights.push(light)




player=playerAsset[2]
var playerHitbox=new BABYLON.MeshBuilder.CreateBox("playerHitbox",{width: 1.2,height:0.6},scene)
playerHitbox.visibility=0
if(DEBUG){
    playerHitbox.showBoundingBox = true
    playerHitbox.visibility=0.2
}
playerHitbox.parent=player

var forward = new BABYLON.Vector3(1, 0, 0);		
var dir = player.getDirection(forward);
dir.normalize();


//player.rotation.x-=pi/2
//player.rotation.z+=pi
player.position.z = -planetDiameter / 2;
player.rotation.z = 0.01;
var playerPivot = new BABYLON.TransformNode("root");
player.parent=playerPivot
//playerPivot.rotate(BABYLON.Axis.X,-pi/2,BABYLON.Space.LOCAL)



var spotLight = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(0,0, -planetRadius), 
    new BABYLON.Vector3(0,0.5,1), Math.PI/4 , 20, scene);
    spotLight.diffuse = new BABYLON.Color3(1, 1, 0);
    spotLight.intensity=0.5
spotLight.parent=player
lights.push(spotLight)

//creating the planet
ground = BABYLON.MeshBuilder.CreateSphere("ground", { diameter: planetDiameter, segments: 32 }, scene);
var planetMaterial = new BABYLON.StandardMaterial("planetMat", scene);
var grassTexture = new BABYLON.Texture("texture/grass.jpg", scene);
grassTexture.uScale = 20;
grassTexture.vScale = 10;
planetMaterial.diffuseTexture = grassTexture;
planetMaterial.bumpTexture = new BABYLON.Texture("texture/bump2.png", scene);
planetMaterial.bumpTexture.uScale=10
planetMaterial.bumpTexture.vScale=10
planetMaterial.bumpTexture.level=0.4
ground.material = planetMaterial;


sun = BABYLON.MeshBuilder.CreateSphere("sun", { diameter: 30, segments: 32 }, scene);
sun.position=new BABYLON.Vector3(100,0,300)
var sunMaterial = new BABYLON.StandardMaterial("sunMat", scene);
sunMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
sun.material=sunMaterial

var gl = new BABYLON.GlowLayer("glow", scene);
gl.intensity = 0.7;
gl.customEmissiveColorSelector = function(mesh, subMesh, material, result) {
    if (mesh.name === "sun") {
        result.set(1, 0.8, 0, 1);
    } else {
        result.set(0, 0, 0, 0);
    }
}

var hl = new BABYLON.HighlightLayer("hl1", scene);
hl.addMesh(sun,new BABYLON.Color3(1,0.5,0));

//some debug utilities
if (DEBUG) {
    //ground.showBoundingBox = true
    ground.visibility = 0.3;
    player.visibility = 0.8;
}


//---------POPULATE PLANET---------------
var mesh=assets.assetMeshes.get("grass.babylon")
uniformlyDistribute(mesh,ground,density=0.5,collisions=true,scene);
createEnemies(light);

// ------------ SHOW UI -----------------

//var playerHealth = new HealthBar(player, light, scene, false);

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
    
    if (PLAYERMOVE) playerPivot.rotate(dir, Math.PI / playerSpeed, BABYLON.Space.WORLD);  // the player moves, the planet stays still
    else ground.rotate(dir, -Math.PI / playerSpeed, BABYLON.Space.WORLD);   // the player doesn't move, the planet rotates
    positionUpdated=true

    forward = true;

    if (previous_forward != forward) {
        if (animating) {
            emptyAnimArray();
            animating = false;
        }
    }
    
    if (startAnimation(animating, forward)) animating = true;

    previous_forward = true;
}
if (inputMap["a"] || inputMap["ArrowLeft"]) {
    //wheelR.rotation.x += 0.05;
    //wheelL.rotation.x -= 0.05;
    player.rotation.z += rotationSpeed;
    if(!rotatingLeft) {
        //walk("R",1)
        rotatingLeft=true
    }

    if (startAnimation(animating, forward)) animating = true;
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

    forward = false;

    if (previous_forward != forward) {
        if (animating) {
            emptyAnimArray();
            animating = false;
        }
    }

    if (startAnimation(animating, forward)) animating = true;

    previous_forward = false;
}
if (inputMap["d"] || inputMap["ArrowRight"]) {
    //wheelR.rotation.x -= 0.05;
    //wheelL.rotation.x += 0.05;
    player.rotation.z -= rotationSpeed;

    if (startAnimation(animating, forward)) animating = true;
}
if (!inputMap["w"] && !inputMap["ArrowUp"] &&
    !inputMap["a"] && !inputMap["ArrowLeft"] &&
    !inputMap["s"] && !inputMap["ArrowDown"] &&
    !inputMap["d"] && !inputMap["ArrowRight"]) {
        
    if (animating) {
        emptyAnimArray();
        animating = false;
        stopAnimation();
        for (var i = 0; i < playerAsset.length; i++) {
            scene.beginAnimation(playerAsset[i], 0, frameRate/speed, false);
        }
    }
}

//shoot
const currentTime = new Date().getTime();
if ((inputMap["h"] || inputMap["e"]) && currentTime > nextBulletTime) {
    
    //avoid singular case
    console.log(player.rotation.z)

    //avoid gimbal lock
    if (player.rotation.z == 0) player.rotation.z += 0.01;
    var mesh=assets.assetMeshes.get("rocket.babylon");
    //shoot parallel bullets
    cannonShoot()
    bulletMode="parallel"
    var projectiles=bulletGen(mesh,bulletParallelCount,player,ground,
        bulletMode,bulletAngleOffset,bulletHorizOffset, bulletRange, bulletSpeed, scene)
    
    // bullets is all existing bullets, projectiles is the bullets fired at once
    for (var pr=0; pr<projectiles.length;pr++) bullets.push(projectiles[pr]);
    

    //shoot arc bullet
    
    bulletMode="arc"
    var projectiles=bulletGen(mesh,bulletArcCount,player,ground,
        bulletMode,bulletAngleOffset,bulletHorizOffset, bulletRange, bulletSpeed, scene)
    // bullets is all existing bullets, projectiles is the bullets fired at once
    for (var pr=0; pr<projectiles.length;pr++) bullets.push(projectiles[pr]);
    
    nextBulletTime = new Date().getTime() + attackSpeed;
    
}
})
//END OnBeforeRenderObservable i.e. input reading//

//compute bullet position and collision
scene.registerBeforeRender(function () {

var currentTime=new Date().getTime()
//console.log(bullets)
for (var idx = 0; idx < bullets.length; idx++) {

    var bullet = bullets[idx];
    var pivot=bullet.pivot
    var bulletMesh=bullet.bullet
    bullet.move()

    var bulletHeight=BABYLON.Vector3.Distance(bulletMesh.getAbsolutePosition(),ground.position)
    var bulletFall=false;
    if(bulletHeight<=planetRadius+bulletMesh.getBoundingInfo().boundingBox.extendSize.x) bulletFall=true  ;
    //bulletFall=false

    //collision bullet-ground
    if (bulletFall) {
        bulletMesh.material.emissiveColor = new BABYLON.Color4(1, 0, 0, 1);
        bulletMesh.dispose();    // delete from scene
        pivot.dispose();
        bullets.splice(idx,1);   // delete from array 
    }

    //collision bullet-objects
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
            if (dead) {
                enemies.splice(j, 1);
                remainingEnemies=enemies.length
            }

            if (enemies.length == 0) {
                console.log("all enemies dead");
                endLevel();
            }
            
            bulletMesh.dispose();
            pivot.dispose();
            bullets.splice(idx, 1);
            break
        }
    }
    
}

for(var idx = 0; idx < enemies.length; idx++) {
    //move enemies
    enemies[idx].moveStep()
    positionUpdated=true
    if(positionUpdated) {
        enemies[idx].updatePosition()
    }

    //collision enemy-player
    //console.log(":"+ newVulnerableTime)
    if(currentTime>newVulnerableTime){
        if (playerHitbox.intersectsMesh(enemies[idx].enemy, false)){
            if (bonusLife > 0) {
                bonusLife -= contactDamage;
            }
            else {
                playerLife -= contactDamage;
            }
            decreaseHealthBar();
            newVulnerableTime = currentTime+invincibleTime;
            console.log("playerLife: "+playerLife)
        }
    }
}
positionUpdated=false

});

//Move enemies
scene.registerBeforeRender(function () {   
    
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
    const path='./asset/';
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
    const path='./asset/';
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
