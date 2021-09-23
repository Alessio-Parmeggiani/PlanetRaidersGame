
//import {test} from "./actors.js"


var canvas = document.getElementById("renderCanvas");

var engine = null;
var scene = null;
var ground = null;
var player = null;
var shadowGenerator=null;

var glowLayer=null

var sceneToRender = null;
var createDefaultEngine = function() { 
    return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true,  disableWebGL2Support: false});
};


//
var pi = Math.PI;
var framerate = 60;
var stepCounter = 0;

//gameplay stats
var PLAYERMOVE = false;
var DEBUG = false;

var actualLevel=0
//player stats

var attackSpeed = 300;
var rotationSpeed = Math.PI / 100;

var godMode=false
var maxPlayerLife = 100;
var playerLife = maxPlayerLife;
var bonusLife = 0;
var playerSpeed = 200;
var contactDamage = 10;
var newVulnerableTime=new Date().getTime();
//ms of invincibility after contact with enemies
var invincibleTime = 500;

//bullets stats
var bulletRange = 1;    // num of revolutions around the planet
var bulletSpeed = Math.PI / 100;
var bulletHeight = 1;
var bulletParallelCount = 1;
var bulletArcCount = 1;
var bulletAngleOffset = pi/12;
var bulletHorizOffset = 0.5;
var bulletMode = "parallel"


//enemy stats
var enemyLife=5;

//number of enemies
var numNormalEnemies=0;
var numFastEnemies=0;
var numTankEnemies=0;

var probTankEnemy=0;
var probFastEnemy=0;

var numEnemies=numNormalEnemies+numFastEnemies+numTankEnemies;
var remainingEnemies=numEnemies;

//duration of spawning animation
var spawnDurationTime=3000; //ms
var spawnDurationFrame=framerate*(spawnDurationTime/1000);

//don't modify: ID of enemy types
var enemyNormalType=1;
var enemyFastType=2;
var enemyTankType=3;

//other stats
var planetDiameter = 9;
var planetRadius = planetDiameter/2;

//assets
const assets = {
    assetMeshes : new Map(),
}

var playerAsset=[];

//assets needed later
const assetsPath = [
    "rocketTest.babylon",
    "rocket.babylon", 
    "grass2.babylon",
    "enemy.babylon",
    "enemyFast.babylon",
    "grass.babylon",
    "enemyTank.babylon",
    "cloud.babylon"
]

const playerPath = [
    "player.babylon",
]

//data
var bullets = [];
var collidingObjects = [];
var enemies = [];
var lights = [];
var upgradeButtons = [];
var displayedUpgrades = [];

// ---- Animations ----
var animating = false;
var forward = true;
var previous_forward = true;
var animations = [];

var fps = document.getElementById("fps");

// ------- BUTTON MANAGER -------
const buttons = Array.from(document.getElementsByTagName("button"));
upgradeButtons = buttons.filter(button => {return button.className == "upgrade_button"});
const congrats = document.getElementById("congrats");
const message = document.getElementById("message");
const container = document.getElementById("container");
const upgrade = document.getElementById("upgrade");
const upgradeList = document.getElementById("upgradeList");
const bar = document.getElementById("bar");
const playerHealth = document.getElementById("playerHealth");
const splash = document.getElementById("back");
const gameOver = document.getElementById("game_over_container");
const eclipse = document.getElementById("eclipse_container");
const endGame = document.getElementById("victory_container");
var chosen_upgrade;
var newLevelSound;

buttons.forEach(button => {
    button.onclick = function() {
        chosen_upgrade = button.getElementsByTagName("span")[0].textContent;
        const icon = document.createElement("img");
        icon.classList.add("icon");
        console.log(chosen_upgrade);
        switch (chosen_upgrade) {
            case "Player speed up":
                playerSpeed /= 2;
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
                icon.src = "icons/Range up.png";
                break;
            case "Health up":
                bonusLife = 30;
                icon.src = "icons/Health up.png";
                const moreHealth = document.createElement("div");
                moreHealth.id = "moreHealth";
                moreHealth.style.left = 30 + playerHealth.offsetWidth + "px";
                bar.appendChild(moreHealth);
                break;
            case "Play":
                splash.addEventListener("transitionend", (event) => {
                    // condition needed to ignore the play button transition
                    if (event.target.id == "back") {
                        splash.remove();
                        newGame()
                        newLevel()
                    }
                })
                splash.classList.add("removed");
                return;
            case "Play again":
            case "Try again":
                // INSERIRE FUNZIONE CHE RESETTA IL LIVELLO
                upgradeButtons = buttons.filter(button => {return button.className == "upgrade_button"});
                displayedUpgrades = [];
                upgradeList.innerHTML = "";
                console.log("try again premuto");
                console.log(actualLevel);
                if (actualLevel < 5) {
                    console.log("oh");
                    gameOver.classList.remove("anim-game_over");
                    eclipse.classList.remove("anim-eclipse");
                    gameOver.style.display = "none";
                }
                else {
                    console.log("ciao");
                    endGame.classList.remove("anim-game_over");
                    endGame.style.display = "none";
                }
                newGame();
                updateHealthBar();
                newLevel();
                newLevelSound.play();
                return;                
        }
        // Managing upgrade buttons
        displayedUpgrades = displayedUpgrades.filter(element => {return element.innerText != button.innerText});
        button.setAttribute("style", "display: none");
        displayedUpgrades.forEach(element => {upgradeButtons.push(element);});
        displayedUpgrades = [];
        // Upgrade animations
        congrats.classList.remove("anim-first");
        message.classList.remove("anim-first");
        container.classList.remove("anim-container");
        upgrade.classList.remove("anim-upgrade");
        canvas.classList.remove("anim-canvas");
        upgradeList.appendChild(icon);

        //game just started
        console.log("START LEVEL: ",actualLevel)

        newLevel()
        newLevelSound.play();
        //createEnemies(light); I can't because the light still isn't defined
    }
})

//
//----------------MAIN LOOP--------------------
//
function main(){
    
var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI/2, 1.2, 10, new BABYLON.Vector3(0, 0, -3), scene);


//mainly for debug, control rotation of camera with mouse
//if(DEBUG) 
    camera.attachControl();
camera.wheelPrecision = 45;

glowLayer = new BABYLON.GlowLayer("glow", scene);
glowLayer.intensity = 0.7;


var light = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(-1, -1, 0.5), scene);
light.intensity = 3;
light.position = new BABYLON.Vector3(20, 20, -10);
lights.push(light)


var light2 = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(1, 1, 0), scene);
light2.diffuse = new BABYLON.Color3(0, 0, 1);
light2.intensity =2;
lights.push(light2)

var light3 = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 0, 0), scene);
//light3.diffuse = new BABYLON.Color3(1, 1, 1);
//light3.groundColor = new BABYLON.Color3(0, 0.5, 0);
light3.intensity =0;
lights.push(light3)


shadowGenerator = new BABYLON.ShadowGenerator(2048, light);

// SOUNDS
var rocketLaunch = new BABYLON.Sound("rocketLaunch", "sounds/Space-Cannon.mp3", scene);
var step = new BABYLON.Sound("step", "sounds/Robot-Footstep_4.mp3", scene);
var enemyHit = new BABYLON.Sound("enemyHit", "sounds/POL-metal-slam-03.wav", scene);
var playerHit = new BABYLON.Sound("playerHit", "sounds/POL-metal-slam-02.wav", scene);
var endLevelSound = new BABYLON.Sound("endLevelSound", "sounds/POL-digital-impact-03.wav", scene);
var enemyDead = new BABYLON.Sound("enemyDead", "sounds/POL-digital-impact-08.wav", scene);
newLevelSound = new BABYLON.Sound("newLevelSound", "sounds/POL-digital-impact-02.wav", scene);



player=playerAsset[2]
var playerHitbox=new BABYLON.MeshBuilder.CreateBox("playerHitbox",{width: 1.2,height:0.6},scene)
playerHitbox.visibility=0
if(DEBUG){
    playerHitbox.showBoundingBox = true
    playerHitbox.visibility=0.2
}
playerHitbox.parent=player


var spotLight = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(0,0, -3), 
    new BABYLON.Vector3(0,0.5,1), Math.PI/2 , 20, scene);
    spotLight.diffuse = new BABYLON.Color3(1, 0.2, 0);
    spotLight.intensity=20
spotLight.parent=player
lights.push(spotLight)


shadowGenerator.addShadowCaster(player,true)

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






//creating the planet
ground = BABYLON.MeshBuilder.CreateSphere("ground", { diameter: planetDiameter, segments: 32 }, scene);

//var grassTexture = new BABYLON.Texture("texture/grass.jpg", scene);
var grassTexture = new BABYLON.Texture("texture/planet.png", scene);
var bumpTexture=new BABYLON.Texture("texture/planet_bump.png", scene);
var roughnessTexture=new BABYLON.Texture("texture/planet-roughness.png",scene);

//SKYBOX

var skybox = BABYLON.Mesh.CreateBox("BackgroundSkybox", 500, scene, undefined, BABYLON.Mesh.BACKSIDE);
var backgroundMaterial = new BABYLON.BackgroundMaterial("backgroundMaterial", scene);
backgroundMaterial.reflectionTexture = new BABYLON.CubeTexture("texture/environment.env", scene);
backgroundMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
skybox.material = backgroundMaterial;



var pbr = new BABYLON.PBRMaterial("pbr", scene);

ground.material = pbr;


pbr.albedoTexture = grassTexture;
pbr.bumpTexture = bumpTexture;
pbr.microSurface=1.0
pbr.reflectionTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("texture/environment.env", scene);
pbr.reflectivityTexture=roughnessTexture

pbr.bumpTexture.level=2
ground.material.maxSimultaneousLights=8
ground.receiveShadows = true;
//some debug utilities
if (DEBUG) {
    //ground.showBoundingBox = true
    ground.visibility = 0.3;
    player.visibility = 0.8;
}

light.parent=ground
light2.parent=ground

//---------POPULATE PLANET---------------
var mesh=assets.assetMeshes.get("cloud.babylon")
clouds=uniformlyDistribute(mesh,ground,number=20,collisions=false,height=20,randomScale=0.03,false);

var mesh=assets.assetMeshes.get("grass.babylon")
uniformlyDistribute(mesh,ground,number=100,collisions=false,height=0,randomScale=0,true);

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
    var forward = new BABYLON.Vector3(1, 0, 0);		
    var dir = player.getDirection(forward);
    dir.normalize();
    
    stepCounter++;
    if (stepCounter%(16*playerSpeed/200) == 0) step.play();
    
    if (PLAYERMOVE) playerPivot.rotate(dir, Math.PI / playerSpeed, BABYLON.Space.WORLD);  // the player moves, the planet stays still
    else {
        ground.rotate(dir, -Math.PI / playerSpeed, BABYLON.Space.WORLD);   // the player doesn't move, the planet rotates   

    }
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

    if (!inputMap["w"] && !inputMap["ArrowUp"] &&
        !inputMap["s"] && !inputMap["ArrowDown"]) {
        stepCounter++;
        if (stepCounter%(16*playerSpeed/200) == 0) step.play();
    }

    if(!rotatingLeft) {
        //walk("R",1)
        rotatingLeft=true
    }

    if (startAnimation(animating, forward)) animating = true;
}
if (inputMap["s"] || inputMap["ArrowDown"]) {

    var forward = new BABYLON.Vector3(1, 0, 0);		
    var dir = player.getDirection(forward);
    dir.normalize();
    
    stepCounter++;
    if (stepCounter%(16*playerSpeed/200) == 0) step.play();
     
    if (PLAYERMOVE) playerPivot.rotate(dir, -Math.PI / playerSpeed, BABYLON.Space.WORLD);
    else ground.rotate(dir, Math.PI / playerSpeed, BABYLON.Space.WORLD);
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
    player.rotation.z -= rotationSpeed;

    if (!inputMap["w"] && !inputMap["ArrowUp"] &&
        !inputMap["s"] && !inputMap["ArrowDown"]) {
        stepCounter++;
        if (stepCounter%(16*playerSpeed/200) == 0) step.play();
    }

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
if ((inputMap[" "] || inputMap["e"]) && currentTime > nextBulletTime) {

    //avoid gimbal lock
    if (player.rotation.z == 0) player.rotation.z += 0.01;
    var mesh=assets.assetMeshes.get("rocket.babylon");
    //shoot parallel bullets
    cannonShoot()
    rocketLaunch.play();
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

fps.innerHTML = engine.getFps().toFixed() + "fps";

var currentTime=new Date().getTime()
//console.log(bullets)
for (var idx = 0; idx < bullets.length && bullets[idx]; idx++) {
    
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
        idx--
    }
    else {
        //collision bullet-enemies 
        for (let j=0; j<enemies.length; j++) {
            if (bulletMesh.intersectsMesh(enemies[j].enemy, false)) {
                //enemy hit
                enemyHit.play();
                enemies[j].whenHit(bullet.damage);

                //delete bullet
                bulletMesh.dispose();
                pivot.dispose();
                bullets.splice(idx, 1);
                idx--
            }
        }
    }
    
}

for(var idx = 0; idx < enemies.length; idx++) {
    //if enemy is alive then move
    if (!enemies[idx].dying) {
        enemies[idx].moveStep()

        positionUpdated=true
        if(positionUpdated) {
            enemies[idx].updatePosition()
        }

        //collision enemy-player
        if(!godMode && currentTime>newVulnerableTime){
            if (playerHitbox.intersectsMesh(enemies[idx].enemy, false)){
                if (playerLife>0) playerHit.play();
                if (bonusLife > 0) {
                    bonusLife -= contactDamage;
                }
                else {
                    playerLife -= contactDamage;
                }
                updateHealthBar();
                newVulnerableTime = currentTime+invincibleTime;
                //player is dead
                if (playerLife == 0) {
                    godMode=true
                    gameOver.classList.add("anim-game_over");
                    eclipse.classList.add("anim-eclipse");
                    gameOver.style.display = "flex";
                    //or enemies still hit player

                }
            }
        }
    }

    //enemy is performing death animation
    else {
        //fall
        enemies[idx].enemy.locallyTranslate(new BABYLON.Vector3(0, -0.004, 0))
        enemies[idx].enemy.rotation.y+=0.01

        enemyHeight=BABYLON.Vector3.Distance(enemies[idx].enemy.getAbsolutePosition(),ground.position)
        if(enemyHeight<=planetRadius+(mesh.getBoundingInfo().boundingBox.extendSize.x)/2) {
            enemies[idx].clean()
            enemies.splice(idx, 1);
            idx--
            enemyDead.play();
            console.log("enemy dead")
            remainingEnemies=enemies.length
            if (enemies.length == 0) {
                console.log("all enemies dead");
                endLevelSound.play();
                actualLevel++;
                if (actualLevel == 5) {
                    endGame.classList.add("anim-game_over");
                    endGame.style.display = "block";
                }
                else {
                    endLevel();
                }
            }
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