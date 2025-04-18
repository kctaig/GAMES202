class TRSTransform {
    constructor(translate = [0, 0, 0], scale = [1, 1, 1]) {
        this.translate = translate;
        this.scale = scale;
    }
}
class Mesh {
	constructor(verticesAttrib, normalsAttrib, texcoordsAttrib, indices, transform) {
		this.indices = indices;
		this.count = indices.length;
		this.hasVertices = false;
		this.hasNormals = false;
		this.hasTexcoords = false;
		// 表示在三个坐标轴的平移量
		const modelTranslation = [transform.modelTransX, transform.modelTransY, transform.modelTransZ];
		// 表示在三个坐标轴的缩放量
		const modelScale = [transform.modelScaleX, transform.modelScaleY, transform.modelScaleZ];
		let meshTrans = new TRSTransform(modelTranslation, modelScale);
		this.transform = meshTrans;

		let extraAttribs = [];

		// 这里的 verticesAttrib 是一个对象 {name : array},其他同理
		if (verticesAttrib != null) {
			// 表明需要传递 verticesAttrib 给 vertexShader
			this.hasVertices = true;
			this.vertices = verticesAttrib.array;
			this.verticesName = verticesAttrib.name;
		}
		if (normalsAttrib != null) {
			this.hasNormals = true;
			this.normals = normalsAttrib.array;
			this.normalsName = normalsAttrib.name;
		}
		if (texcoordsAttrib != null) {
			this.hasTexcoords = true;
			this.texcoords = texcoordsAttrib.array;
			this.texcoordsName = texcoordsAttrib.name;
		}
	}

	static cube(transform) {
		const positions = [
			// Front face
			-1.0, -1.0, 1.0,
			1.0, -1.0, 1.0,
			1.0, 1.0, 1.0,
			-1.0, 1.0, 1.0,

			// Back face
			-1.0, -1.0, -1.0,
			-1.0, 1.0, -1.0,
			1.0, 1.0, -1.0,
			1.0, -1.0, -1.0,

			// Top face
			-1.0, 1.0, -1.0,
			-1.0, 1.0, 1.0,
			1.0, 1.0, 1.0,
			1.0, 1.0, -1.0,

			// Bottom face
			-1.0, -1.0, -1.0,
			1.0, -1.0, -1.0,
			1.0, -1.0, 1.0,
			-1.0, -1.0, 1.0,

			// Right face
			1.0, -1.0, -1.0,
			1.0, 1.0, -1.0,
			1.0, 1.0, 1.0,
			1.0, -1.0, 1.0,

			// Left face
			-1.0, -1.0, -1.0,
			-1.0, -1.0, 1.0,
			-1.0, 1.0, 1.0,
			-1.0, 1.0, -1.0,
		];
		const indices = [
			0, 1, 2, 0, 2, 3,    // front
			4, 5, 6, 4, 6, 7,    // back
			8, 9, 10, 8, 10, 11,   // top
			12, 13, 14, 12, 14, 15,   // bottom
			16, 17, 18, 16, 18, 19,   // right
			20, 21, 22, 20, 22, 23,   // left
		];
		// Float32Array : 储存32位浮点数的类型化数组
		return new Mesh({ name: 'aVertexPosition', array: new Float32Array(positions) }, null, null, indices, transform);
	}
}