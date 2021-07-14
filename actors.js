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

        //distance to move before stopping
        this.maxdistanceMoved=Math.PI/4

        //how much to move per frame
        this.velocity=Math.PI/200

        //how much to wait before moving again, if 0 continue movement
        this.moveInterval=500 //ms

        //distance traveled in this step
        this.distanceStepMoved=0

        this.direction=1

        // how many times it was hit by a bullet
        this.numHits = 0;
        
        this.healthBar = null;
        
        this.bullet=bulletMesh

        //1: shooter
        //2: follow player
        this.enemyType=enemyType
        this.bulletCount=1

        this.DEBUG=DEBUG

        // to change its color when hit
        this.mesh.material = new BABYLON.StandardMaterial("matEnemy", scene);
        this.mesh.material.diffuse = new BABYLON.Color3(1, 1, 1);
    }

    spawn(position=new BABYLON.Vector3(0,0,0), light){
        console.log("creating enemy at: "+position)
        //time used for naming
        const currentTime = new Date().getTime();

        this.enemy=this.mesh.createInstance()
        this.enemy.position=position;
        if(DEBUG) this.enemyPivot = BABYLON.Mesh.CreateCapsule(`enemyPivot`, { radiusTop: 0.05 }, scene);
        else this.enemyPivot=new BABYLON.TransformNode(`${currentTime}enemyPivot`)

        //rotate pivot towards player w.r.t enemy position
        rotateTowards(this.enemyPivot,this.enemy,this.target)
        
        //orient enemy so that it's on surface along normal
        orientSurface(this.enemy,position,this.planet)

        this.enemy.setParent(this.enemyPivot)
        this.enemyPivot.setParent(this.planet)

        if(position.x>0) this.direction=-1

        this.healthBar = new HealthBar(this.enemy, light, this.scene);
      
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
        
        //var dir=1
        if (this.distanceStepMoved<this.maxdistanceMoved && currentTime>this.nextEnemyMoveTime) {
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
    }

    updatePosition(){
        console.log("changing direction")
        //every step it should update the direction
        this.enemyPivot.setParent(null)
        this.enemy.setParent(null)
       
        this.enemyPivot.rotation = BABYLON.Vector3.Zero()
        //da fare animato magari
        
        rotateTowards(this.enemyPivot,this.enemy,this.target)

        if(this.enemy.getAbsolutePosition().x>0) this.direction=-1
        else this.direction=1

        this.enemy.setParent(this.enemyPivot)
        this.enemyPivot.setParent(this.planet)
    }


    // If the enemy is hit once it becomes red, when it's hit the second
    // time it disappears
    whenHit() {
        this.numHits += 1;
        if (this.numHits > 2) {
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
    constructor(mesh,shooter=null,planet,scene){
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

        this.bulletSpeed = Math.PI / 300;
        this.bulletHeight = 1;

        this.bulletRange = 150;

        
    }/*
    setSpeed(speed) {
        this.bulletSpeed=speed
    }
    setRange(range) {
        this.bulletRange=range
    }*/
    spawn(dir){
        const currentTime = new Date().getTime();
    
        //get width of bullet
        var mesh=this.mesh
        
    
        bulletHorizOffset = mesh.getBoundingInfo().boundingBox.extendSize.x;
    
        var dir;
        
        if(DEBUG) this.pivot = BABYLON.Mesh.CreateCapsule(`${currentTime}pivot$`, { radiusTop: 0.05 }, scene); // capsule is visible for debug
        else this.pivot = new BABYLON.TransformNode(`${currentTime}pivot$`); // transformNode is invisible
        //get instance from pre-loaded model
    
        this.bullet = mesh.createInstance();
        this.bullet.scaling = new BABYLON.Vector3(0.15,0.15,0.15);
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
        this.bullet.locallyTranslate(new BABYLON.Vector3(0, 1.5, 0));
    
        //this.bullet.material = new BABYLON.StandardMaterial("bulletmat", scene);
        this.bullet.checkCollisions = true;    
    
    }

    move() {
        this.bullet.locallyTranslate(new BABYLON.Vector3(0, 0, 1/this.bulletRange));
        this.pivot.rotate(this.axis, this.bulletSpeed * this.direction, BABYLON.Space.LOCAL);
    }
}

class HealthBar {
    constructor(player, light, scene, enemy=true) {
        this.player = player;

        this.mesh = BABYLON.MeshBuilder.CreateCylinder("healthbar",
            {height: 0.8, diameter: 0.15}, scene);

        this.mesh.parent = player;

        if (enemy) {
            //this.mesh.position.z = -0.5;
            this.mesh.position.y = 0.5;
        }
        else this.mesh.position.z = -0.5;
        
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

    whenHit() {
        this.mesh.scaling.y -= 0.33;

        if (this.mesh.scaling.y > 0.5) {
            this.mesh.material.emissiveColor = new BABYLON.Color3(1, 0.8, 0);
        } else if (this.mesh.scaling.y > 0.3) {
            this.mesh.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
        } else {
            this.mesh.dispose();
        }
    }
}
