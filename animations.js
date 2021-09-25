const frameRate = 60;
const speed = 5;

/*

//player components and relative indices
0: lower body           /
1: front left joint 1   Z
2: upper body           Z
3: cannon               Z
4: front left joint 2   Y
5: front left joint 3   Y

6: front right joint 1  Z
7: rear left joint 1    Z
8: rear right joint 1   Z

9: front right joint 2  Y
10: rear left joint 2   Y
11: rear right joint 2  Y

12: front right joint 3 Y
13: rear left joint 3   Y
14: rear right joint 3  Y

*/

function addAnimation(leg, forward) {
    const joint1Anim = new BABYLON.Animation("joint1Anim", "rotation.z", 
    frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    const joint2Anim = new BABYLON.Animation("joint2Anim", "rotation.y", 
    frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    const joint3Anim = new BABYLON.Animation("joint3Anim", "rotation.y", 
    frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    const keyFrames1 = [];
    const keyFrames2 = [];

    var joint1 = playerAsset[1];
    var joint2 = playerAsset[4];
    var joint3 = playerAsset[5];

    var i = 1;
    var j1 = 1;
    var j2 = 0;
    var add = 0;

    var f = 1;

    if (!forward) f = -1;

    if (leg == "fr") {
        joint1 = playerAsset[6];
        joint2 = playerAsset[9];
        joint3 = playerAsset[12];
        i = 1;
        j1 = 0;
        j2 = -1;
        add = 10;
    }
    else if (leg == "rl") {
        joint1 = playerAsset[7];
        joint2 = playerAsset[10];
        joint3 = playerAsset[13];
        i = -1;
        j1 = 0;
        j2 = 1;
        add = 10;
    }
    else if (leg == "rr") {
        joint1 = playerAsset[8];
        joint2 = playerAsset[11];
        joint3 = playerAsset[14];
        i = -1;
        j1 = -1;
        j2 = 0;
        add = 0;
    }

    keyFrames1.push({
        frame: 0,
        value: 0
    })
    keyFrames1.push({
        frame: 0.5*frameRate/speed,
        value: f*i*(25-add)/180*pi
    });
    keyFrames1.push({
        frame: 1.5*frameRate/speed,
        value: f*i*(-15-add)/180*pi
    });
    keyFrames1.push({
        frame: 2*frameRate/speed,
        value: 0
    });

    joint1Anim.setKeys(keyFrames1);
    joint3Anim.setKeys(keyFrames1);

    keyFrames2.push({
        frame: 0,
        value: j1*(12)/180*pi
    });
    keyFrames2.push({
        frame: 0.3*frameRate/speed,
        value: j1*(12)/180*pi
    });
    keyFrames2.push({
        frame: 0.45*frameRate/speed,
        value: j2*(12)/180*pi
    });
    keyFrames2.push({
        frame: 1.3*frameRate/speed,
        value: j2*(12)/180*pi
    });
    keyFrames2.push({
        frame: 1.45*frameRate/speed,
        value: j1*(12)/180*pi
    });
    keyFrames2.push({
        frame: 2*frameRate/speed,
        value: j1*(12)/180*pi
    });

    joint2Anim.setKeys(keyFrames2);

    joint1Anim.enableBlending = true;
    joint2Anim.enableBlending = true;
    joint3Anim.enableBlending = true;
    joint1Anim.blendingSpeed = 0.1;
    joint2Anim.blendingSpeed = 0.1;
    joint3Anim.blendingSpeed = 0.1;

    joint1.animations.push(joint1Anim);
    joint2.animations.push(joint2Anim);
    joint3.animations.push(joint3Anim);
}

function bodyAnimation() {
    const bodyAnim = new BABYLON.Animation("bodyAnim", "position.y", 
    frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    keyFrames = [];

    keyFrames.push({
        frame: 0,
        value: 0
    });
    keyFrames.push({
        frame: 0.45*frameRate/speed,
        value: -0.02
    });
    keyFrames.push({
        frame: 0.6*frameRate/speed,
        value: 0
    });
    keyFrames.push({
        frame: 1.45*frameRate/speed,
        value: -0.02
    });
    keyFrames.push({
        frame: 1.6*frameRate/speed,
        value: 0
    });
    keyFrames.push({
        frame: 2*frameRate/speed,
        value: 0
    });

    bodyAnim.setKeys(keyFrames);
    bodyAnim.enableBlending = true;
    bodyAnim.blendingSpeed = 0.1;

    playerAsset[2].animations.push(bodyAnim);
}

function stopAnimation() {
    const bodyStopAnim = new BABYLON.Animation("bodyStopAnim", "position.y", 
    frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    const yRotAnim = new BABYLON.Animation("yRotAnim", "rotation.y", 
    frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    const zRotAnim = new BABYLON.Animation("zRotAnim", "rotation.z", 
    frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

    const indicesJoints1 = [1, 6, 7, 8];
    const indicesJoints23 = [4, 5, 9, 10, 11, 12, 13, 14];

    keyFrames = [];

    keyFrames.push({
        frame: 0,
        value: 0
    });
    keyFrames.push({
        frame: 0.5*frameRate/speed,
        value: 0
    });
    keyFrames.push({
        frame: frameRate/speed,
        value: 0
    });

    bodyStopAnim.setKeys(keyFrames);
    yRotAnim.setKeys(keyFrames);
    zRotAnim.setKeys(keyFrames);
    bodyStopAnim.enableBlending = true;
    yRotAnim.enableBlending = true;
    zRotAnim.enableBlending = true;
    bodyStopAnim.blendingSpeed = 0.1;
    yRotAnim.blendingSpeed = 0.1;
    zRotAnim.blendingSpeed = 0.1;

    indicesJoints1.forEach(n => {
        playerAsset[n].animations.push(zRotAnim);
    });
    indicesJoints23.forEach(n => {
        playerAsset[n].animations.push(yRotAnim);
    });
    playerAsset[2].animations.push(bodyStopAnim);
}

function startAnimation(animating, forward=true) {
    if (!animating) {
        addAnimation("fl", forward);
        addAnimation("fr", forward);
        addAnimation("rl", forward);
        addAnimation("rr", forward);
        bodyAnimation();
        for (var i = 0; i < playerAsset.length; i++) {
            animations.push(scene.beginAnimation(playerAsset[i], 0, 2*frameRate, true));
        }
        return true;
    }
    else 
        return false;
}

function emptyAnimArray() {
    for (var i = 0; i < playerAsset.length; i++) {
        animations[i].stop();
        playerAsset[i].animations.length = 0;         
    }
    animations.length = 0;
}

//cannon rotates and simulate recoil
function cannonShoot() {
    
    var totalDuration=frameRate*(attackSpeed/1000)
    var cannon=playerAsset[3]

    //in case of error, position cannon in the correct place
    cannon.position.y=0.1575

    var pos=cannon.position.y
    var rot=cannon.rotation.y
     
    const cannonAnim = new BABYLON.Animation("cannonAnim", "rotation.y", 
    frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

    keyFrames = [];

    keyFrames.push({
        frame: 0,
        value: rot
    });
    keyFrames.push({
        frame: 0.5*totalDuration,
        value: rot+Math.PI/4
    });

    cannonAnim.setKeys(keyFrames);
    cannonAnim.enableBlending = true;
    cannonAnim.blendingSpeed = 0.1;

    const cannonAnim2 = new BABYLON.Animation("cannonAnim", "position.y", 
    frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

    keyFrames = [];

    keyFrames.push({
        frame: 0,
        value: pos
    });
    keyFrames.push({
        frame: 0.2*totalDuration,
        value: pos-0.1
    });
    keyFrames.push({
        frame: 0.8*totalDuration,
        value: pos
    });
    cannonAnim2.setKeys(keyFrames);

    scene.beginDirectAnimation(cannon, [cannonAnim,cannonAnim2], 0,  0.8*totalDuration, true);
}


//spawn animation for enemies
function spawningAnimation(position) {
    var material = new BABYLON.StandardMaterial("mat", scene);
    material.emissiveColor = new BABYLON.Color3(0.2, 0.6, 1);
    material.diffuseTexture = new BABYLON.Texture("texture/effect.png", scene);
    material.opacityTexture=new BABYLON.Texture("texture/blend.png", scene);
    material.opacityTexture.wAng = -Math.PI/2; 
    
    var cylinder = BABYLON.MeshBuilder.CreateCylinder("spawnAnimation",{height: 1}, scene);
    cylinder.position=position
    orientSurface(cylinder,position,ground)
    cylinder.locallyTranslate(new BABYLON.Vector3(0,0.5,0))
    cylinder.setParent(ground)

    var ring1 = BABYLON.MeshBuilder.CreateTorus("torus", {thickness: 0.1,diameter:1.2},scene);
    orientSurface(ring1,position,ground)
    ring1.locallyTranslate(new BABYLON.Vector3(0,0.5,0))
    ring1.setParent(cylinder)

    var ring2 = BABYLON.MeshBuilder.CreateTorus("torus", {thickness: 0.1,diameter:1.2},scene);
    orientSurface(ring2,position,ground)
    ring2.locallyTranslate(new BABYLON.Vector3(0,0.5,0))
    ring2.setParent(cylinder)
    
    cylinder.material=material
    ring1.material=material
    ring2.material=material

    scene.registerBeforeRender(function () {
        ring1.rotation.y+=0.3  
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
        frame: spawnDurationFrame/1.5,
        value: 1
    });

    keyFrames.push({
        frame: spawnDurationFrame,
        value: 0
    });

    anim1.setKeys(keyFrames);
    var spawnAnim1=scene.beginDirectAnimation(cylinder, [anim1], 0,  spawnDurationFrame, false);
    spawnAnim1.onAnimationEnd=function() { cylinder.dispose(true, true); }
    var spawnAnim2=scene.beginDirectAnimation(ring1, [anim1], 0,  spawnDurationFrame, false);
    spawnAnim2.onAnimationEnd=function() { ring1.dispose(true,true); }
    var spawnAnim3=scene.beginDirectAnimation(ring2, [anim1], 0,  spawnDurationFrame, false);
    spawnAnim3.onAnimationEnd=function() { ring2.dispose(true,true); }


}
