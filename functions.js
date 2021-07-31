
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
        if( mode=="arc" && i==(Math.ceil(bulletCount/2)-1)) {
            //don't shoot central bullet
        }
        else {
            console.log("spawning"+i)
            bullet=new Bullet(mesh,shooter,ground,scene)
            bullet.spawn(dir)
            projectiles.push(bullet);
        }

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

function spawningAnimation(position) {
    var cylinder = BABYLON.MeshBuilder.CreateCylinder("spawnAnimation",{height: 1}, scene);
    //var cylinder=assets.assetMeshes.get("teleport.babylon").createInstance();
    
    console.log(cylinder)
    cylinder.position=position
    //cylinder.scaling.y=0.08
    //cylinder.rotation.z=Math.PI/4
    //cylinder.visibility=0
    
    
    orientSurface(cylinder,position,ground)
    cylinder.locallyTranslate(new BABYLON.Vector3(0,0.5,0))
    var material = new BABYLON.StandardMaterial("mat", scene);
    material.emissiveColor = new BABYLON.Color3(0.2, 0.6, 1);
    material.diffuseTexture = new BABYLON.Texture("texture/effect.png", scene);
    
    //material.diffuseTexture.hasAlpha = true;
    material.opacityTexture=new BABYLON.Texture("texture/blend.png", scene);
    material.opacityTexture.wAng = -Math.PI/2; 
    
    cylinder.material=material

    var ring1 = BABYLON.MeshBuilder.CreateTorus("torus", {thickness: 0.1,diameter:1.2},scene);
    orientSurface(ring1,position,ground)
    ring1.locallyTranslate(new BABYLON.Vector3(0,0.5,0))
    ring1.material=material
   
    scene.registerBeforeRender(function () {
        ring1.rotation.y+=0.3
        
    })

    var ring2 = BABYLON.MeshBuilder.CreateTorus("torus", {thickness: 0.1,diameter:1.2},scene);
    orientSurface(ring2,position,ground)
    ring2.locallyTranslate(new BABYLON.Vector3(0,0.5,0))
    ring2.material=material

    scene.registerBeforeRender(function () {
        ring2.rotation.x-=0.2
    })

    var frameRate=60
    var anim1 = new BABYLON.Animation("rising", "visibility",
     frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    var keyFrames = []; 

    keyFrames.push({
        frame: 0,
        value: 0
    });

    keyFrames.push({
        frame: 60,
        value: 1
    });

    keyFrames.push({
        frame: 90,
        value: 0
    });

    anim1.setKeys(keyFrames);
    var spawnAnim1=scene.beginDirectAnimation(cylinder, [anim1], 0,  180, true);
    spawnAnim1.onAnimationEnd=function() { cylinder.dispose()   }
    var spawnAnim2=scene.beginDirectAnimation(ring1, [anim1], 0,  180, true);
    spawnAnim2.onAnimationEnd=function() { ring1.dispose()   }
    var spawnAnim3=scene.beginDirectAnimation(ring2, [anim1], 0,  180, true);
    spawnAnim3.onAnimationEnd=function() { ring2.dispose()   }

   
    


}

function createEnemies(){   
    //CREATE ENEMIES
    //generate normal enemy
    var mesh=assets.assetMeshes.get("enemy.babylon");
    mesh.scaling=new BABYLON.Vector3(0.4,0.4,0.4)
    var enemyType=enemyNormalType
    for(var i=0;i<numNormalEnemies;i++) {
        var position=randomPos(planetRadius)
        spawningAnimation(position)
        //taret is player with some randomness
        var target=player
        var enemy=new Enemy(mesh,ground,target,enemyType,DEBUG,scene)
        enemy.spawn(position);
        enemy.enemy.locallyTranslate(new BABYLON.Vector3(0, 0.5, 0))
        enemies.push(enemy)
    }

    //genrate fast enemy
    var mesh=assets.assetMeshes.get("enemyFast.babylon");
    mesh.scaling=new BABYLON.Vector3(0.15,0.15,0.15)
    enemyType=enemyFastType
    for(var i=0;i<numFastEnemies;i++) {
        var position=randomPos(planetRadius)
        spawningAnimation(position)
        //taret is player with some randomness
        var target=player
        var enemy=new Enemy(mesh,ground,target,enemyBullet,enemyType,DEBUG,scene)
        enemy.spawn(position);
        enemy.enemy.locallyTranslate(new BABYLON.Vector3(0, 0.5, 0))
        enemies.push(enemy)
    }
}

function endLevel() {
    console.log("endLevel called");
    congrats.classList.add("anim-first");
    message.classList.add("anim-first");
    container.classList.add("anim-container");
    upgrade.classList.add("anim-upgrade");
    canvas.classList.add("anim-canvas");
}   

function increaseDifficulty(newEnemies) {
    probFastEnemy +=  1/numNormalEnemies
    probTankEnemy = probFastEnemy/2
    //add 3 enemies
    for(var i=0;i<newEnemies;i++){
        var random=Math.random()
        if(random>probTankEnemy) numTankEnemies+=1
        if(random>probFastEnemy) numFastEnemies+=1
        else numNormalEnemies+=1
    }
}

function newLevel(){
    increaseDifficulty(3)
    createEnemies()
    numEnemies=numNormalEnemies+numFastEnemies+numTankEnemies
}
