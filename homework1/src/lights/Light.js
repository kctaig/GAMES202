class EmissiveMaterial extends Material {

    constructor(lightIntensity, lightColor) {
        // 调用父类的构造函数
        super({
            // 1f: 1D float value
            'uLigIntensity': { type: '1f', value: lightIntensity },
            // 3fv: 3D float vector
            'uLightColor': { type: '3fv', value: lightColor }
        }, [], LightCubeVertexShader, LightCubeFragmentShader);

        // 添加了子类的属性
        this.intensity = lightIntensity;
        this.color = lightColor;
    }

    GetIntensity() {
        return [this.intensity * this.color[0], this.intensity * this.color[1], this.intensity * this.color[2]]
    }
}
