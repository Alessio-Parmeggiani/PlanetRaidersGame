const frameRate = 60;
const speed = 5;

function addAnimation(leg, forward=true) {
    const joint1Anim = new BABYLON.Animation("joint1Anim", "rotation.y", 
    frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    const joint2Anim = new BABYLON.Animation("joint2Anim", "rotation.z", 
    frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    const joint3Anim = new BABYLON.Animation("joint3Anim", "rotation.z", 
    frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    const keyFrames1 = [];
    const keyFrames2 = [];

    var joint1 = playerAsset[1];
    var joint2 = playerAsset[4];
    var joint3 = playerAsset[5];

    var i = 1;
    var j1 = 1;
    var j2 = 0;
    var k = 1;
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
    joint1Anim.blendingSpeed = 0.05;
    joint2Anim.blendingSpeed = 0.05;
    joint3Anim.blendingSpeed = 0.05;

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
    bodyAnim.blendingSpeed = 0.05;

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
    bodyStopAnim.blendingSpeed = 0.05;
    yRotAnim.blendingSpeed = 0.05;
    zRotAnim.blendingSpeed = 0.05;

    indicesJoints1.forEach(n => {
        playerAsset[n].animations.push(yRotAnim);
    });
    indicesJoints23.forEach(n => {
        playerAsset[n].animations.push(zRotAnim);
    });
    playerAsset[2].animations.push(bodyStopAnim);
}

function startAnimation(animating) {
    if (!animating) {
        addAnimation("fl");
        addAnimation("fr");
        addAnimation("rl");
        addAnimation("rr");
        bodyAnimation();
        for (var i = 0; i < playerAsset.length; i++) {
            animations.push(scene.beginAnimation(playerAsset[i], 0, 2*frameRate, true));
        }
        return true;
    }
    else 
        return false;
}