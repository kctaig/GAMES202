class Material {
    #flatten_uniforms;
    #flatten_attribs;
    #vsSrc;
    #fsSrc;
    // Uniforms is a map, attribs is a Array
    constructor(uniforms, attribs, vsSrc, fsSrc, frameBuffer) {
        this.uniforms = uniforms;
        this.attribs = attribs;
        this.#vsSrc = vsSrc;
        this.#fsSrc = fsSrc;
        
        // 默认 uniform
        this.#flatten_uniforms = ['uViewMatrix','uModelMatrix', 'uProjectionMatrix', 'uCameraPos', 'uLightPos'];
        // 继续添加 uniform
        for (let k in uniforms) {
            this.#flatten_uniforms.push(k);
        }
        this.#flatten_attribs = attribs;

        this.frameBuffer = frameBuffer;
    }

    // 动态添加额外的顶点属性到材质中,在 meshRender 中使用
    setMeshAttribs(extraAttribs) {
        for (let i = 0; i < extraAttribs.length; i++) {
            this.#flatten_attribs.push(extraAttribs[i]);
        }
    }

    // 着色器的编译，使得 uniforms 和 attribs 可以动态自定义
    compile(gl) {
        return new Shader(gl, this.#vsSrc, this.#fsSrc,
            // shaderLocations 是一个对象，包含 uniforms 和 attribs 的位置
            {
                uniforms: this.#flatten_uniforms,
                attribs: this.#flatten_attribs
            }
        );
    }
}