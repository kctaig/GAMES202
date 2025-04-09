class DirectionalLight {

    constructor(lightIntensity, lightColor, lightPos, focalPoint, lightUp, hasShadowMap, gl) {
        this.mesh = Mesh.cube(setTransform(0, 0, 0, 0.2, 0.2, 0.2, 0));
        this.mat = new EmissiveMaterial(lightIntensity, lightColor);
        this.lightPos = lightPos;
        this.focalPoint = focalPoint;
        this.lightUp = lightUp
        // 当光源参数 hasShadowMap 为 true 时，将开启 Shadow Map
        this.hasShadowMap = hasShadowMap;
        this.fbo = new FBO(gl);
        if (!this.fbo) {
            console.log("无法设置帧缓冲区对象");
            return;
        }
    }

    CalcLightMVP(translate, scale) {
        // 创建单位矩阵
        let lightMVP = mat4.create();
        let modelMatrix = mat4.create();
        let viewMatrix = mat4.create();
        let projectionMatrix = mat4.create();

        // Model transform

        // View transform

        // Projection transform


        // projectionMatrix * viewMatrix -> lightMVP
        mat4.multiply(lightMVP, projectionMatrix, viewMatrix);
        // lightMVP * modelMatrix -> lightMVP
        mat4.multiply(lightMVP, lightMVP, modelMatrix);

        return lightMVP;
    }
}
