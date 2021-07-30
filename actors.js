class Enemy{
    constructor(mesh,planet,target,bulletMesh,enemyType,DEBUG=true,scene){
        this.mesh=mesh

        this.enemy=null
        this.pivot=null

        this.planet=planet

        //move toward target
        this.target=target
        

        //movement
        this.nextEnemyMoveTime=new Date().getTime();
        this.nextUpdateTargetTime=new Date().getTime();
        //distance to move before stopping
        this.maxdistanceMoved=Math.PI/4

        //how much to move per frame
        this.velocity=Math.PI/200
        this.velocity=0

        //how much to wait before moving again, if 0 continue movement
        this.moveInterval=5 //ms
        //how much to wait before updating the target to another point near player
        this.updateTargetInterval=100


        //distance traveled in this step
        this.distanceStepMoved=0

        this.direction=1

        // how many times it was hit by a bullet
        this.life = 10;
        
        this.healthBar = null;
        
        this.bullet=bulletMesh

        //1: shooter
        //2: follow player
        this.enemyType=enemyType
        this.bulletCount=1

        this.DEBUG=DEBUG

       
        // to change its color when hit
        //this.mesh.material = new BABYLON.StandardMaterial("matEnemy", scene);
        //this.mesh.material.diffuse = new BABYLON.Color3(1, 1, 1);
    }

    spawn(position=new BABYLON.Vector3(0,0,0), light){
        console.log("creating enemy at: "+position)
        //time used for naming
        const currentTime = new Date().getTime();

        this.enemy=this.mesh.createInstance()
        this.enemy.position=position;
        if(DEBUG) this.enemyPivot = BABYLON.Mesh.CreateCapsule(`enemyPivot`, { radiusTop: 0.05 }, scene);
        else this.enemyPivot=new BABYLON.TransformNode(`${currentTime}enemyPivot`)
        //console.log(this.target)
        //rotate pivot towards player w.r.t enemy position
        var newTarget=getPointNearPosition(this.target.getAbsolutePosition(),0)
        rotateTowards(this.enemyPivot,this.enemy.getAbsolutePosition(),newTarget)

        
        //orient enemy so that it's on surface along normal
        orientSurface(this.enemy,position,this.planet)

        this.enemy.setParent(this.enemyPivot)
        this.enemyPivot.setParent(this.planet)

        if(position.x>0) this.direction=-1

        this.healthBar = new HealthBar(this.enemy, light, this.scene,true,this.life);
      
        this.enemy.checkCollisions = true;
        //this.enemy.showBoundingBox = true;
    }

    moveStep(){
        //move of some distance and wait MoveInterval
        //if moveInterval is set to 0, the movement is continous
        const currentTime = new Date().getTime();

        //compute how to rotate pivot
        var forward = new BABYLON.Vector3(0, 0, 1);		
        var direction = this.enemyPivot.getDirection(forward);
        direction.normalize();

        var dir=this.direction
        this.enemy.addRotation(0,0.05,0)
        //var dir=1
        if (this.moveInterval<50 || (this.distanceStepMoved<this.maxdistanceMoved && currentTime>this.nextEnemyMoveTime)) {
            //move of velocity
                      
            this.enemyPivot.rotate(direction,this.velocity*dir, BABYLON.Space.WORLD);
            this.distanceStepMoved+=this.velocity
        }
        else if(this.distanceStepMoved>0){
            //stop moving and wait
            //console.log(dir)
            this.nextEnemyMoveTime = new Date().getTime() + this.moveInterval;
            this.distanceStepMoved=0    
        }
        /*
        //i don't know if this should be used
        if(currentTime>this.nextUpdateTargetTime) {
            this.updatePosition();
            this.nextUpdateTargetTime = new Date().getTime() + this.updateTargetInterval;
        }
        */
    }

    updatePosition(){
        //console.log("changing direction")
        //every step it should update the direction

        //new target to choose every x seconds
        const currentTime = new Date().getTime();
        if(currentTime>this.nextUpdateTargetTime) {
            //console.log("changing direction")
            this.enemyPivot.setParent(null)
            this.enemy.setParent(null)
           
            this.enemyPivot.rotation = BABYLON.Vector3.Zero()    

            //new target
            var newTarget=getPointNearPosition(this.target.getAbsolutePosition(),0.2*remainingEnemies)
            rotateTowards(this.enemyPivot,this.enemy.getAbsolutePosition(),newTarget)
    
            if(this.enemy.getAbsolutePosition().x>0) this.direction=-1
            else this.direction=1
    
            this.enemy.setParent(this.enemyPivot)
            this.enemyPivot.setParent(this.planet)
            
            this.nextUpdateTargetTime = new Date().getTime() + this.updateTargetInterval;
        }

    }


    // If the enemy is hit once it becomes red, when it's hit the second
    // time it disappears
    whenHit(damage) {
        this.life-=damage
        this.healthBar.whenHit(damage)
        if (this.life <= 0) {
            this.enemy.dispose();
            return 1;
        }
        else {
            this.mesh.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
            return 0;
        }
    }

    shoot(){
        var projectiles=bulletGen(this.bullet,this.bulletCount,this.enemy,this.planet,
            "parallel",scene)
        for (var pr=0; pr<projectiles.length;pr++) bullets.push(projectiles[pr]);
    }
  
}
//serve la classe proiettile?
class Bullet{
    constructor(mesh,shooter=null,planet,speed,range,scene){
        this.mesh=mesh
        this.planet=planet

        this.bullet=null
        this.pivot=null

        //movement
        this.axis=null
        this.direction=null

        this.shooter=shooter

        //stats
        this.bulletAngleOffset = pi/12;
        this.bulletHorizOffset = 0.5;

        this.bulletSpeed = speed;
        
        this.bulletHeight = 0.3;

        this.bulletRange = range;

        this.damage=1;

        this.bulletSize=0

        
    }/*
    setSpeed(speed) {
        this.bulletSpeed=speed
    }
    setRange(range) {
        this.bulletRange=range
    }*/
    getRangeFromNTurns(N) {
        var s=this.bulletSpeed
        var hi=this.bulletHeight
        var range= (-hi*s)/ (2*Math.PI *N)
        
        return range
    }
    createParticles() {
        
        var particles= new BABYLON.ParticleSystem("particles", 500);
        particles.particleTexture = new BABYLON.Texture("texture/flare.png");
        particles.emitter= this.bullet
        
        //console.log(mesh.getBoundingInfo().boundingBox.extendSize)
        //particles.worldOffset=new BABYLON.Vector3(0, -mesh.getBoundingInfo().boundingBox.extendSize.y,0);
        var direction1=new BABYLON.Vector3(0, -10,0)
        var direction2=new BABYLON.Vector3(0, -5, 0)
        //particles.createPointEmitter(direction1, direction2);
        var maxEmitBox=new BABYLON.Vector3(0.1, 0.1, 0)
        var minEmitBox=new BABYLON.Vector3(-0.1, -0.1, 0)
        particles.createBoxEmitter(direction1,direction2,minEmitBox,maxEmitBox)
        
        
        particles.color1=new BABYLON.Color3(1,0,0)
        particles.color2=new BABYLON.Color3(0.5,0.5,0)
        particles.colorDead=new BABYLON.Color3(0.1,0.1,0.1)

        particles.minLifeTime = 0.05;
        particles.maxLifeTime = 0.1;

        particles.minSize=0.05
        particles.maxSize=0.2

        particles.emitRate = 300;
        //particles.direction1=direction1
        //particles.direction2 =direction2
        console.log(particles)
        //particles.isLocal = true;


        particles.startPositionFunction = (worldMatrix, positionToUpdate, particle, isLocal) => {
            var randX = BABYLON.Scalar.RandomRange(minEmitBox.x, maxEmitBox.x);
            var randY = BABYLON.Scalar.RandomRange(minEmitBox.y, maxEmitBox.y);
            randY-=this.bulletSize.y
            var randZ = BABYLON.Scalar.RandomRange(minEmitBox.z, maxEmitBox.z);
            BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, worldMatrix, positionToUpdate);
          };

        
        particles.start();


    }
    spawn(dir){
        const currentTime = new Date().getTime();
    
        //get width of bullet
        var mesh=this.mesh
       
        this.bulletSize=mesh.getBoundingInfo().boundingBox.extendSize
        bulletHorizOffset = this.bulletSize.x;
    
        var dir;
        
        if(DEBUG) this.pivot = BABYLON.Mesh.CreateCapsule(`${currentTime}pivot$`, { radiusTop: 0.05 }, scene); // capsule is visible for debug
        else this.pivot = new BABYLON.TransformNode(`${currentTime}pivot$`); // transformNode is invisible
        //get instance from pre-loaded model
    
        this.bullet = mesh.createInstance();
        //this.bullet.scaling = new BABYLON.Vector3(0.15,0.15,0.15);
        var shooterPos = this.shooter.getAbsolutePosition();
        this.bullet.position = shooterPos;
    
        //this.bullet.rotation.y=90
        // dir is the direction of the cannon basically
        this.bullet.rotation.z = dir;
        this.pivot.rotation.z = dir;
    
        this.bullet.setParent(this.pivot);
        this.pivot.setParent(this.planet);
    
        this.axis = new BABYLON.Vector3(dir, 0, 0);
        this.direction = dir > 0 ? 1 : -1;
    
        //slightly higher in order to not collide with ground immediately
        this.bullet.locallyTranslate(new BABYLON.Vector3(0, 0, -this.bulletHeight));
        //little forward w.r.t shooter
        this.bullet.locallyTranslate(new BABYLON.Vector3(0, 0.5, 0));
    
        //this.bullet.material = new BABYLON.StandardMaterial("bulletmat", scene);
        this.bullet.checkCollisions = true;    

        this.bulletRange=this.getRangeFromNTurns(this.bulletRange);
        this.createParticles()
        
    
    }

    move() {
        this.bullet.rotation.y+=0.1
        //this.bullet.locallyTranslate(new BABYLON.Vector3(0, 0, 1/this.bulletRange));
        this.bullet.position.z-=this.bulletRange
        this.pivot.rotate(this.axis, this.bulletSpeed * this.direction, BABYLON.Space.LOCAL);
    }
}

class HealthBar {
    constructor(player, light, scene, enemy=true,life) {
        this.player = player;

        this.mesh = BABYLON.MeshBuilder.CreateCylinder("healthbar",
            {height: 0.8, diameter: 0.15}, scene);

        this.mesh.parent = player;

        this.startLife=life
        this.remainingLife=life

        this.greenThreshold=0.8
        this.yellowThreshold=0.5
        this.redThreshold=0.3

        if (enemy) {
            //this.mesh.position.z = -0.5;
            //this.mesh.position.z = player.getBoundingInfo().boundingBox.extendSize.y;
            this.mesh.position.y= player.getBoundingInfo().boundingBox.extendSize.z*1.4
        }
        else {
            this.mesh.position.z = -0.5;
            this.mesh.position.y-=1
        }
        
        this.mesh.rotation.z = pi/2;

        this.mesh.material = new BABYLON.StandardMaterial("healthbar", scene);
        this.mesh.material.emissiveColor = new BABYLON.Color3(0, 1, 0);
        light.excludedMeshes.push(this.mesh);
        
        var gl = new BABYLON.GlowLayer("glow", scene);
        gl.intensity = 0.3;
        gl.addIncludedOnlyMesh(this.mesh);

        // to make the healthbar always face the camera
        //this.mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Z || BABYLON.Mesh.BILLBOARDMODE_X;
    }

    whenHit(damage) {
        this.remainingLife-=damage
        //remaining:full health = scaling : 1 (full bar)
        //scaling=remaining/full Health
        console.log(this.remainingLife/this.startLife)
        this.mesh.scaling.y = this.remainingLife/this.startLife;


        if (this.mesh.scaling.y>this.greenThreshold) 
            this.mesh.material.emissiveColor = new BABYLON.Color3(0, 0.8, 0);
        
        else if (this.mesh.scaling.y>this.yellowThreshold) 
            this.mesh.material.emissiveColor = new BABYLON.Color3(1, 0.8, 0);
        
        else if (this.mesh.scaling.y > this.redThreshold) 
            this.mesh.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
        
        else if (this.mesh.scaling.y <= 0){
            this.mesh.dispose();
        }

    }
}
