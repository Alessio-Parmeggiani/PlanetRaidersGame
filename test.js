/*
//alternative laoding, not used
assetsManager.onTaskSuccessObservable.add(function(task) {
    // disable the original mesh and store it in the Atlas
    console.log('loaded and stored '+asset)
    task.loadedMeshes[0].setEnabled(false)
    assets.assetMeshes.set(asset, task.loadedMeshes[0])
    
})


assetsManager.load();
console.log("loading has ended")
assetsManager.onTasksDoneObservable.add(function(tasks) {
    //var errors = tasks.filter(function(task) {return task.taskState === BABYLON.AssetTaskState.ERROR});
    //var successes = tasks.filter(function(task) {return task.taskState !== BABYLON.AssetTaskState.ERROR});


    console.log("all task done")
   
});
*/

/*
//alternative loading inside init
initFunction().then(() => {

    //trying to render scene only when all assets are loaded
    
    console.log("Loading assets...")
    var assetsManager = new BABYLON.AssetsManager(scene);
    assetsPath.forEach(asset => {
        
        const name='load '+asset
        const path='./'
        const meshTask = assetsManager.addMeshTask(name, "", path, asset)
        console.log("loading : "+ asset)
        meshTask.onSuccess = (task) => {
            // disable the original mesh and store it in the Atlas
            console.log('loaded and stored '+asset)
            task.loadedMeshes[0].setEnabled(false)
            assets.assetMeshes.set(asset, task.loadedMeshes[0])
            
        }
        meshTask.onError = function (task, message, exception) {
            console.log(message, exception);
        }
        
    })
    //do all tasks
    assetsManager.load();
    console.log("loading has ended")

    //when tasks done, render scene
    assetsManager.onFinish = function(tasks) {
        engine.runRenderLoop(function() {
            scene.render();
        });
    };
    
});
*/


/*
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
*/


//Creating the (temporary) player
/*
player = BABYLON.MeshBuilder.CreateBox("player", { size: 1, width: playerWidth,segments: 32 }, scene);

if (PLAYERMOVE) {
    var playerPivot = new BABYLON.TransformNode("root");
    player.setParent(playerPivot);
    camera.parent = playerPivot;
} 

var wheelR = BABYLON.MeshBuilder.CreateBox("playerWheelR", {size: 0.8, width: wheelWidth }, scene);
wheelR.parent = player;
wheelR.position.x = playerWidth/2 + wheelWidth/2;

var wheelL = BABYLON.MeshBuilder.CreateBox("playerWheelL", {size: 0.8,width: wheelWidth  }, scene);
wheelL.parent = player;
wheelL.position.x = -(playerWidth/2 + wheelWidth/2);
*/

/*
var skyMaterial = new BABYLON.SkyMaterial("skyMaterial", scene);
skyMaterial.backFaceCulling = false;

//Sky material
var skybox = BABYLON.Mesh.CreateBox("skyBox", 1000.0, scene);
skybox.material = skyMaterial;
skyMaterial.turbidity = 20
//skyMaterial.azimuth = 0.1;
skyMaterial.inclination = 0.3;
*/
/*

// Environment Texture
var hdrTexture = new BABYLON.HDRCubeTexture("texture/nebula.hdr", scene, 512);

// Skybox
var hdrSkybox = BABYLON.Mesh.CreateBox("hdrSkyBox", 1000.0, scene);
var hdrSkyboxMaterial = new BABYLON.PBRMaterial("skyBox", scene);
hdrSkyboxMaterial.backFaceCulling = false;
hdrSkyboxMaterial.reflectionTexture = hdrTexture.clone();
hdrSkyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
hdrSkyboxMaterial.microSurface = 1.1;
hdrSkyboxMaterial.cameraExposure = 0.8;
hdrSkyboxMaterial.cameraContrast = 1.6;
hdrSkyboxMaterial.disableLighting = true;
hdrSkybox.material = hdrSkyboxMaterial;
hdrSkybox.infiniteDistance = true;
*/


//THINGS TESTED FOR SKY
//sun with glow
/*

sun = BABYLON.MeshBuilder.CreateSphere("sun", { diameter: 30, segments: 32 }, scene);
sun.position=new BABYLON.Vector3(100,0,300)
var sunMaterial = new BABYLON.StandardMaterial("sunMat", scene);
sunMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
sun.material=sunMaterial


glowLayer.customEmissiveColorSelector = function(mesh, subMesh, material, result) {
    if (mesh.name === "sun") {
        result.set(1, 0.8, 0, 1);
    } else {
        result.set(0, 0, 0, 0);
    }
}
*/
//gl.addIncludedOnlyMesh(sun);
/*
var highlightLayer = new BABYLON.HighlightLayer("hl1", scene);
highlightLayer.addMesh(sun,new BABYLON.Color3(1,0.5,0));
*/


//colored skybox

/*
var colors = [];
var numVertices = skybox.getTotalVertices();

for (let i = 0; i < numVertices/3; ++i) {
    colors.push(0.3, 0.2, 0.6, 1);
    colors.push(0.6, 0.1, 0.6, 1);
    colors.push(0.8, 0.6, 0.2, 1);
}

skybox.setVerticesData("color", colors);
*/

// Skybox
/*
var skybox = BABYLON.Mesh.CreateBox('SkyBox', 1000, scene, false, BABYLON.Mesh.BACKSIDE);
skybox.material = new BABYLON.SkyMaterial('sky', scene);
skybox.material.inclination =-0.2;
skybox.material.useSunPosition=true
skybox.material.sunPosition=new BABYLON.Vector3(100,300,300)
skybox.material.turbidity=50
*/

