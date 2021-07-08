class Enemy{
    constructor(mesh,planet,target){
        this.mesh=mesh

        this.enemy=null
        this.pivot=null

        this.planet=planet
        this.target=target

        //movement
        this.nextEnemyMoveTime=new Date().getTime();
        this.maxdistanceMoved=Math.PI/4
        this.velocity=Math.PI/200
        this.moveInterval=300 //ms
    }

    spawn(position=new BABYLON.Vector3(0,0,0)){
        //time for naming
        const currentTime = new Date().getTime();

        //serve il this ovunque?
        this.enemy=this.mesh.createInstance()
        this.enemy.position=position
        this.enemyPivot=new BABYLON.TransformNode(`${currentTime}enemyPivot`)

        //rotate pivot towards player w.r.t enemy position
        rotateTowards(this.enemyPivot,this.enemy,this.target)
        
        //orient enemy so that it's on surface along normal
        orientSurface(this.enemy,position,this.planet)

        this.enemy.setParent(this.enemyPivot)
        this.enemyPivot.setParent(this.planet)

    }

    moveStep(){
        //move of some distance and wait MoveInterval
        //if moveInterval is set to 0, the movement is continous
        const currentTime = new Date().getTime();

        var forward = new BABYLON.Vector3(0, 0, 1);		
        var direction = enemyPivot.getDirection(forward);
        direction.normalize();
        var distanceMoved=0
        
        if (distanceMoved<this.maxdistanceMoved && currentTime>this.nextEnemyMoveTime) {
            this.enemyPivot.rotate(direction,this.velocity, BABYLON.Space.WORLD);
            distanceMoved+=this.velocity
        }
        else if(distanceMoved>0){
            this.nextEnemyMoveTime = new Date().getTime() + this.moveInterval;
            distanceMoved=0
        }
    }

}
