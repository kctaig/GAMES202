function loadOBJ(renderer, path, name, objMaterial, transform) {

	// 加载管理器实例，它可以用来追踪和管理多个加载任务
	const manager = new THREE.LoadingManager();
	manager.onProgress = function (item, loaded, total) {
		console.log(item, loaded, total);
	};

	// onProgress 函数的作用是在加载资源的过程中提供实时反馈，显示资源的加载进度
	function onProgress(xhr) {
		if (xhr.lengthComputable) {
			const percentComplete = xhr.loaded / xhr.total * 100;
			console.log('model ' + Math.round(percentComplete, 2) + '% downloaded');
		}
	}
	function onError() { }

	new THREE.MTLLoader(manager)
		.setPath(path)
		.load(name + '.mtl', function (materials) {
			materials.preload(); // 会进行资源的异步加载
			// 创建一个 OBJLoader 对象
			new THREE.OBJLoader(manager)
				.setMaterials(materials)
				// 设置 obj 模型所在路径
				.setPath(path) 
				// 加载指定的 obj 模型
				.load(name + '.obj', function (object) { 
					// 遍历加载模型对象的所有子对象
					object.traverse(function (child) {
						if (child.isMesh) {
							// 提取网格 geometry
							let geo = child.geometry;
							// 提取材质
							let mat;
							if (Array.isArray(child.material)) mat = child.material[0];
							else mat = child.material;
							
							var indices = Array.from({ length: geo.attributes.position.count }, (v, k) => k);
							// 生成适合渲染的 Mesh
							let mesh = new Mesh(
								{ name: 'aVertexPosition', array: geo.attributes.position.array },
								{ name: 'aNormalPosition', array: geo.attributes.normal.array },
								{ name: 'aTextureCoord', array: geo.attributes.uv.array },
								indices, 
								transform
							);

							let colorMap = new Texture();
							if (mat.map != null) {
								colorMap.CreateImageTexture(renderer.gl, mat.map.image);
							}
							else {
								colorMap.CreateConstantTexture(renderer.gl, mat.color.toArray());
							}

							let material, shadowMaterial;
							let Translation = [transform.modelTransX, transform.modelTransY, transform.modelTransZ];
							let Scale = [transform.modelScaleX, transform.modelScaleY, transform.modelScaleZ];

							let light = renderer.lights[0].entity;
							switch (objMaterial) {
								case 'PhongMaterial':
									// buildPhongMaterial 返回的是一个 Promise 对象
									material = buildPhongMaterial(colorMap, mat.specular.toArray(), light, Translation, Scale, "./src/shaders/phongShader/phongVertex.glsl", "./src/shaders/phongShader/phongFragment.glsl");
									shadowMaterial = buildShadowMaterial(light, Translation, Scale, "./src/shaders/shadowShader/shadowVertex.glsl", "./src/shaders/shadowShader/shadowFragment.glsl");
									break;
							}
							// material 是一个 Promise 对象，它最终会被解析为一个值
							// then：用于处理 Promise 成功状态的回调函数
							// （data）=>{} 是箭头函数，material 会作为参数 data 传递给这个函数
							material.then((data) => {
								let meshRender = new MeshRender(renderer.gl, mesh, data);
								renderer.addMeshRender(meshRender);
							});
							shadowMaterial.then((data) => {
								let shadowMeshRender = new MeshRender(renderer.gl, mesh, data);
								renderer.addShadowMeshRender(shadowMeshRender);
							});
						}
					});
				}, onProgress, onError);
		});
}
