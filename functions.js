
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

function explode(emitter) {
        BABYLON.ParticleHelper.CreateAsync("explosion", scene).then((set) => {
            set.systems.forEach(s => {
                s.minSize=0.01
                s.maxSize=0.05
                s.disposeOnStop = true;
                //console.log(s)
            });
            set.start(emitter);
            
        });
        
}

// get a point on a range near another point (used for the target of the enemies)
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
function uniformlyDistribute(mesh,ground,number=1,collisions=false,height=0,randomScale=0,shadows=false){
    
    objects = [];
    for (var i = 0; i < number; i++) {
        
        obj = mesh.createInstance(); 
        if(shadows) shadowGenerator.addShadowCaster(obj);       
        
        //random scale between -randomScale and +randomScale
        if (randomScale) {
            var scale = 0.1+((Math.random()*2)-1)*randomScale;
            obj.scaling=new BABYLON.Vector3(scale,scale,scale)
        }

        //point on surface of sphere
        var position = randomPos(planetDiameter/2);
        obj.position = position;
        orientSurface(obj,position,ground);

        if (height) {
            new_height=height+((Math.random()*2)-1)*height/2
            obj.locallyTranslate(new BABYLON.Vector3(0,new_height,0))
        }

        obj.parent = ground;
        objects.push(obj);

        if(collisions) {
            obj.checkCollisions = true;
        }    
        
    }

    if (collisions) collidingObjects.push(objects);
    return objects;
}

//bullet generator: compute angle and position for parallel and arc bullets
function bulletGen(mesh,bulletCount=1,shooter=null,ground,
    mode="parallel",bulletAngleOffset=bulletAngleOffset,bulletHorizOffset=0.5,
    range=bulletRange, speed=bulletSpeed,scene) {

    bulletHorizOffset =0.1 + mesh.getBoundingInfo().boundingBox.extendSize.x;

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
        if( mode=="arc" && i==(Math.ceil(bulletCount/2)-1)) {
            //don't shoot central bullet for arc bullets
        }
        else {
            
            bullet=new Bullet(mesh,shooter,ground,scene)
            bullet.spawn(dir)
            projectiles.push(bullet);
        }

        if(mode=="parallel") {
            bullet.bullet.locallyTranslate(new BABYLON.Vector3(horizPosition, 0, 0));
            horizPosition += bulletHorizOffset;
            projectiles.push(bullet);
        }
        if (mode=="arc") dir += bulletAngleOffset;
    
    }
    return projectiles
}


//rotate obj following direction from A to B
function rotateTowards(obj,A,B){
    //var direction = B.getAbsolutePosition().subtract(A.getAbsolutePosition());
    var direction=B.subtract(A);
    obj.rotation = direction;

    //const target = enemyDir;
    obj.lookAt(direction);
    obj.rotate(new BABYLON.Vector3(1, 0 ,0), Math.PI/2);
}

//generate all type of enemies
function createEnemies(){   
    //CREATE ENEMIES
    //generate normal enemy
    var mesh=assets.assetMeshes.get("enemy.babylon");
    mesh.scaling=new BABYLON.Vector3(0.4,0.4,0.4)
    var enemyType=enemyNormalType
    for(var i=0;i<numNormalEnemies;i++) {
        var position=randomPos(planetRadius)
        //taret is player with some randomness
        var target=player
        var enemy=new Enemy(mesh,ground,target,enemyType,DEBUG,scene)
        enemy.spawn(position);
        enemy.enemy.locallyTranslate(new BABYLON.Vector3(0, 0.5, 0))
        shadowGenerator.addShadowCaster(enemy.enemy,false);  
        enemies.push(enemy)
    }

    //genrate fast enemy
    var mesh=assets.assetMeshes.get("enemyFast.babylon");
    mesh.scaling=new BABYLON.Vector3(0.15,0.15,0.15)
    enemyType=enemyFastType
    for(var i=0;i<numFastEnemies;i++) {
        var position=randomPos(planetRadius)
        //taret is player with some randomness
        var target=player
        var enemy=new Enemy(mesh,ground,target,enemyType,DEBUG,scene)
        enemy.spawn(position);
        enemy.enemy.locallyTranslate(new BABYLON.Vector3(0, 0.5, 0))
        shadowGenerator.addShadowCaster(enemy.enemy); 
        enemies.push(enemy)
    }

    //genrate tank enemy
    var mesh=assets.assetMeshes.get("enemyTank.babylon");
    mesh.scaling=new BABYLON.Vector3(0.5,0.5,0.5)
    enemyType=enemyTankType
    for(var i=0;i<numTankEnemies;i++) {
        var position=randomPos(planetRadius)
        //taret is player with some randomness
        var target=player
        var enemy=new Enemy(mesh,ground,target,enemyType,DEBUG,scene)
        enemy.spawn(position);
        enemy.enemy.locallyTranslate(new BABYLON.Vector3(0, 0.5, 0))
        shadowGenerator.addShadowCaster(enemy.enemy); 
        enemies.push(enemy)
    }
}

//after a level ended remove all remaining entities if any
function clearGame() {
    while(enemies.length>0){
        enemies[0].enemy.dispose()
        enemies.splice(0, 1);
    }
    while(bullets.length>0){
        bullets[0].bullet.dispose();
        bullets[0].pivot.dispose();
        bullets.splice(0, 1);
    }
    
    for(var k=0;k<scene.meshes.length;k++){
        if(scene.meshes[k].name && scene.meshes[k].name.includes("bullet") ) {
            scene.meshes[k].dispose()
            console.log("found a bullet to dispose")
        }
    }
}

//start a new game: reset stats and remove entities
function newGame(){
    console.log("new game")
    actualLevel=0
    //reset enemies
    numNormalEnemies=0;
    numFastEnemies=0;
    numTankEnemies=0;

    probTankEnemy=0;
    probFastEnemy=0;

    //reset playerStats
    bulletArcCount=1
    bulletParallelCount=1
    bulletSpeed=Math.PI / 100
    bulletRange=1

    playerSpeed=200
    attackSpeed=500
    //reset health
    playerLife=maxPlayerLife

    godMode=false

    clearGame()
} 

//end level screen and upgrades
function endLevel() {
    console.log("endLevel called");
    upgradeButtons.forEach(button => {
        button.setAttribute("style", "display: none");
    });
    var randomIndex;
    displayedUpgrades = [];
    for (var i=0; i<2 && upgradeButtons.length != 0; i++) {
        randomIndex = Math.floor(Math.random()*upgradeButtons.length);
        upgradeButtons[randomIndex].setAttribute("style", "display: flex");
        displayedUpgrades.push(upgradeButtons.splice(randomIndex, 1)[0]);
    }
    congrats.classList.add("anim-first");
    message.classList.add("anim-first");
    container.classList.add("anim-container");
    upgrade.classList.add("anim-upgrade");
    canvas.classList.add("anim-canvas");
}   

//start a new level
function newLevel(){
    clearGame()
    increaseDifficulty(3)
    createEnemies()
    numEnemies=numNormalEnemies+numFastEnemies+numTankEnemies
    console.log("num of enemies in this level:",enemies.length,"---(normal,fast,tank)=",numNormalEnemies,numFastEnemies,numTankEnemies)
}

//add 3 new enemies and increase probability of new enemies
function increaseDifficulty(newEnemies) {
    
    //add 3 enemies
    for(var i=0;i<newEnemies;i++){
        var random=Math.random()
        if(random<probTankEnemy) numTankEnemies+=1
        else if(random<probFastEnemy) numFastEnemies+=1
        else numNormalEnemies+=1
    }
    console.log("enemy probabilities: fast=",probFastEnemy,"tank=",probTankEnemy)
    probFastEnemy +=  0.1
    probTankEnemy = probFastEnemy/2
    
}


function updateHealthBar() {
    var newWidth;
    if (document.getElementById("moreHealth") != null) {
        if (bonusLife == 0) {
            moreHealth.remove();
            moreHealth = null;
        }
        else {
            newWidth = bonusLife/100*maxPlayerLife;
            moreHealth.style.width = `${newWidth}px`;
        }
    }
    else {
        newWidth = playerLife/100*maxPlayerLife;
        console.log(newWidth)
        playerHealth.style.width = `${newWidth}px`;

        
        if (newWidth >= maxPlayerLife) {
            playerHealth.style.background = "#40ff20";
            playerHealth.style.boxShadow = "0px 0px 3px 2px #40ff22"
        }
        else if (newWidth < maxPlayerLife*(0.75) && newWidth > maxPlayerLife*(0.5)) {
            playerHealth.style.background = "#ffcc00";
            playerHealth.style.boxShadow = "0px 0px 3px 2px #ffcc00";
        }
        else if (newWidth < maxPlayerLife*(0.5)) {
            playerHealth.style.background = "#ff0000";
            playerHealth.style.boxShadow = "0px 0px 3px 2px #ff0000";
        }
    }
}
