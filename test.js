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