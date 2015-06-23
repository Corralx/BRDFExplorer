var CONFIG = (function()
{
	var private =
    {
    	'ANTIALIASING': false,
    	'STENCIL': false,
        'FOV_Y': 60.0,
        'NEAR_PLANE': 0.1,
        'FAR_PLANE': 1000,
        'LIBRARY_DIR': 'lib/',
        'SHADER_DIR': 'shader/',
        'SHADER_LIBRARY_PATH': 'shader_lib.json',
        'CUBEMAP_DIR': 'img/',
        'CUBEMAP_LIBRARY_PATH': 'cubemap_lib.json',
        'MODEL_DIR': 'model/',
        'MODEL_LIBRARY_PATH': 'model_lib.json'
    };

    return {
    	get: function(name) { return private[name]; }
    };
})();

var URL_PARAMS;
(window.onpopstate = function() {
    var match,
        pl     = /\+/g,
        search = /([^&=]+)=?([^&]*)/g,
        decode = function(s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    URL_PARAMS = {};
    while (match = search.exec(query))
       URL_PARAMS[decode(match[1])] = decode(match[2]);
})();

ShaderLibrary = {};
CubeMapLibrary = {};
ModelLibrary = {};

var renderer, scene, camera, stats, ext_stats, controls, reflection_cube, model_loader, is_loading_model, is_loading_cubemap, gui, skybox, material;

function init()
{
	renderer = new THREE.WebGLRenderer({
		antialias: CONFIG.get('ANTIALIASING') || URL_PARAMS['antialiasing'] == 'true',
		stencil: CONFIG.get('STENCIL')
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	renderer.setClearColor(0x000000, 1.0);

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(CONFIG.get('FOV_Y'), window.innerWidth / window.innerHeight, CONFIG.get('NEAR_PLANE'), CONFIG.get('FAR_PLANE'));
	window.addEventListener('resize', onWindowResize, false);
	scene.add(camera);
	camera.position.z = 2.0;

	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.noZoom = true;
	controls.noPan = true;

	model_loader = new THREE.AssimpJSONLoader();
	is_loading_model = false;
	is_loading_cubemap = false;

	initGUI();
	initStats();
	initMaterial();
	initSkybox();
	loadShaders();
	loadCubeMaps();
	loadModels();

	render();
}

function initGUI()
{
	$.notify.defaults({ globalPosition: "bottom right" });

	var gui_logic = function()
	{
		this.model = '';
		this.environment = '';

		this.temperature = 7000.0;
		this.light_intensity = 1.0;
		this.ambient_intensity = 0.01;

		this.albedo = [ 255, 0, 0 ];
		this.roughness = 0.3;
		this.specular = 0.1;
		this.metallic = 0.0;
		this.diffuse_model = '';
		this.dist_model = '';
		this.shadowing_model = '';
		this.fresnel_model = '';
		this.roughness_remap = '';
	};

	gui = new dat.GUI();
	gui.logic = new gui_logic();

	gui.scene_folder = gui.addFolder("Scene");
	gui.scene_folder.open();

	gui.model = gui.scene_folder.add(gui.logic, 'model', "Model", []);
	gui.model_callback = function(value)
	{
		var current_model = getCurrentModel();
		var new_model = ModelLibrary[value];

		loadModel(new_model, function()
		{
			scene.remove(current_model.object);
			scene.add(new_model.object);
			current_model.current = false;
			new_model.current = true;

			new_model.object.children[0].material = material;
		});
	};

	gui.environment = gui.scene_folder.add(gui.logic, 'environment', "Environment", []);
	gui.environment_callback = function(value)
	{
		var current_cubemap = getCurrentEnvironment();
		var new_cubemap = CubeMapLibrary[value];

		loadCubeMap(new_cubemap, function()
		{
			setSkybox(new_cubemap);
			current_cubemap.current = false;
			new_cubemap.current = true;
		});
	};

	gui.light_folder = gui.addFolder("Light");
	gui.light_folder.open();

	gui.temperature = gui.light_folder.add(gui.logic, 'temperature', "Temperature", 1000.0, 40000.0);
	gui.light_intensity = gui.light_folder.add(gui.logic, 'light_intensity', "Light Intensity", 0.0, 5.0);
	gui.ambient_intensity = gui.light_folder.add(gui.logic, 'ambient_intensity', "Ambient Intensity", 0.0, 5.0);

	gui.material_folder = gui.addFolder("Material");
	gui.material_folder.open();

	gui.albedo = gui.material_folder.addColor(gui.logic, 'albedo', "Albedo");
	gui.roughness = gui.material_folder.add(gui.logic, 'roughness', "Roughness", 0.0, 1.0);
	gui.specular = gui.material_folder.add(gui.logic, 'specular', "Specular", 0.0, 1.0);
	gui.metallic = gui.material_folder.add(gui.logic, 'metallic', "Metallic", 0.0, 1.0);
	gui.diffuse_model = gui.material_folder.add(gui.logic, 'diffuse_model', "Diffuse Model", []);
	gui.diffuse_model_callback = function(value)
	{
		getCurrentDiffuseModel().current = false;
		ShaderLibrary.chunks.diffuse[value].current = true;
		updateMaterial();
	};

	gui.dist_model = gui.material_folder.add(gui.logic, 'dist_model', "Distribution Term", []);
	gui.dist_model_callback = function(value)
	{
		getCurrentDistributionTerm().current = false;
		ShaderLibrary.chunks.distribution[value].current = true;
		updateMaterial();
	};

	gui.shadowing_model = gui.material_folder.add(gui.logic, 'shadowing_model', "Shadowing Term", []);
	gui.shadowing_model_callback = function(value)
	{
		getCurrentShadowingTerm().current = false;
		ShaderLibrary.chunks.shadowing[value].current = true;
		updateMaterial();
	};

	gui.fresnel_model = gui.material_folder.add(gui.logic, 'fresnel_model', "Fresnel Term", []);
	gui.fresnel_model_callback = function(value)
	{
		getCurrentFresnelTerm().current = false;
		ShaderLibrary.chunks.fresnel[value].current = true;
		updateMaterial();
	};

	gui.remap_model = gui.material_folder.add(gui.logic, 'roughness_remap', "Roughness Remap", []);
	gui.remap_model_callback = function(value)
	{
		getCurrentRemapTerm().current = false;
		ShaderLibrary.chunks.remap[value].current = true;
		updateMaterial();
	};
}

function initStats()
{
	if (URL_PARAMS['debug'] != 'true')
		return;

	stats = new Stats();
	stats.setMode(1);

	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';

	document.body.appendChild(stats.domElement);

	ext_stats = new THREEx.RendererStats();
	ext_stats.domElement.style.position = 'absolute';
	ext_stats.domElement.style.left = '0px';
	ext_stats.domElement.style.bottom = '0px';

	document.body.appendChild(ext_stats.domElement);
}

function initMaterial()
{
	material = new THREE.ShaderMaterial();
	material.name = "BRDF";
	material.lights = false;
	material.defines = "";
	material.uniforms =
	{
		world_normal_matrix: 	{ type: "m3", value: new THREE.Matrix3() },
		albedo: 				{ type: "v3", value: new THREE.Vector3() },
		specular: 		  		{ type: "f",  value: 0.1				 },
		metallic: 				{ type: "f",  value: 0.0 				 },
		roughness: 				{ type: "f",  value: 0.3 				 },
		environment: 			{ type: "t",  value: null 				 },
		light_color: 			{ type: "v3", value: new THREE.Vector3() },
		light_direction: 		{ type: "v3", value: new THREE.Vector3() },
		light_intensity: 		{ type: "f",  value: 1.0 				 },
		ambient_intensity: 		{ type: "f",  value: 0.01 				 }
	};

	material.uniforms.light_direction.value.set(-50.0, -50.0, -50.0);
	material.uniforms.albedo.value.set(1.0, 0.0, 0.0);
}

function initSkybox()
{
	var shader = THREE.ShaderLib["cube"];
	var materialSkyBox = new THREE.ShaderMaterial(
	{
		fragmentShader: shader.fragmentShader,
		vertexShader: shader.vertexShader,
		uniforms: shader.uniforms,
		depthWrite: false,
		side: THREE.BackSide
	});
	
	skybox = new THREE.Mesh(new THREE.BoxGeometry(500, 500, 500), materialSkyBox);
	scene.add(skybox);
}

function loadShaders()
{
	$.ajaxSetup({beforeSend: function(xhr)
	{
  		if (xhr.overrideMimeType)
  			xhr.overrideMimeType("application/json");
  	}});

	$.getJSON(CONFIG.get('LIBRARY_DIR') + CONFIG.get('SHADER_LIBRARY_PATH')).done(function(json)
	{
		$.ajaxSetup({beforeSend: function(xhr)
		{
  			if (xhr.overrideMimeType)
  				xhr.overrideMimeType("text/plain");
  		}});

		ShaderLibrary.chunks = {};
		ShaderLibrary.chunks.diffuse = {};
		ShaderLibrary.chunks.distribution = {};
		ShaderLibrary.chunks.shadowing = {};
		ShaderLibrary.chunks.fresnel = {};
		ShaderLibrary.chunks.remap = {};

		/* Diffuse */
		gui.material_folder.remove(gui.diffuse_model);
		gui_diffuse = [];

		// We assume before anyone request them, we already loaded every material (for now)
		json.chunks.diffuse.forEach(function(diffuse)
		{
			gui_diffuse.push(diffuse.name);

			ShaderLibrary.chunks.diffuse[diffuse.name] = diffuse;
			if (diffuse.default)
				ShaderLibrary.chunks.diffuse[diffuse.name].current = true;
			else
				ShaderLibrary.chunks.diffuse[diffuse.name].current = false;
			$.ajax(CONFIG.get('SHADER_DIR') + diffuse.path).done(function(src)
			{
				ShaderLibrary.chunks.diffuse[diffuse.name].src = src;
			}).fail(function()
			{
				$.notify("Fragment shader chunk " + diffuse.path + " not found!", "error");
				return;
			});
		});

		gui.diffuse_model = gui.material_folder.add(gui.logic, 'diffuse_model', "Diffuse Model", gui_diffuse);
		gui.diffuse_model.onFinishChange(gui.diffuse_model_callback);

		/* Distribution */
		gui.material_folder.remove(gui.dist_model);
		gui_dist = [];

		json.chunks.distribution.forEach(function(dist)
		{
			gui_dist.push(dist.name);

			ShaderLibrary.chunks.distribution[dist.name] = dist;
			if (dist.default)
				ShaderLibrary.chunks.distribution[dist.name].current = true;
			else
				ShaderLibrary.chunks.distribution[dist.name].current = false;
			$.ajax(CONFIG.get('SHADER_DIR') + dist.path).done(function(src)
			{
				ShaderLibrary.chunks.distribution[dist.name].src = src;
			}).fail(function()
			{
				$.notify("Fragment shader chunk " + dist.path + " not found!", "error");
				return;
			});
		});

		gui.dist_model = gui.material_folder.add(gui.logic, 'dist_model', "Distribution Term", gui_dist);
		gui.dist_model.onFinishChange(gui.dist_model_callback);

		/* Shadowing */
		gui.material_folder.remove(gui.shadowing_model);
		gui_shadow = [];

		json.chunks.shadowing.forEach(function(shadow)
		{
			gui_shadow.push(shadow.name);

			ShaderLibrary.chunks.shadowing[shadow.name] = shadow;
			if (shadow.default)
				ShaderLibrary.chunks.shadowing[shadow.name].current = true;
			else
				ShaderLibrary.chunks.shadowing[shadow.name].current = false;
			$.ajax(CONFIG.get('SHADER_DIR') + shadow.path).done(function(src)
			{
				ShaderLibrary.chunks.shadowing[shadow.name].src = src;
			}).fail(function()
			{
				$.notify("Fragment shader chunk " + shadow.path + " not found!", "error");
				return;
			});
		});

		gui.shadowing_model = gui.material_folder.add(gui.logic, 'shadowing_model', "Shadowing Term", gui_shadow);
		gui.shadowing_model.onFinishChange(gui.shadowing_model_callback);

		/* Fresnel */
		gui.material_folder.remove(gui.fresnel_model);
		gui_fresnel = [];

		json.chunks.fresnel.forEach(function(fresnel)
		{
			gui_fresnel.push(fresnel.name);

			ShaderLibrary.chunks.fresnel[fresnel.name] = fresnel;
			if (fresnel.default)
				ShaderLibrary.chunks.fresnel[fresnel.name].current = true;
			else
				ShaderLibrary.chunks.fresnel[fresnel.name].current = false;
			$.ajax(CONFIG.get('SHADER_DIR') + fresnel.path).done(function(src)
			{
				ShaderLibrary.chunks.fresnel[fresnel.name].src = src;
			}).fail(function()
			{
				$.notify("Fragment shader chunk " + fresnel.path + " not found!", "error");
				return;
			});
		});

		gui.fresnel_model = gui.material_folder.add(gui.logic, 'fresnel_model', "Fresnel Term", gui_fresnel);
		gui.fresnel_model.onFinishChange(gui.fresnel_model_callback);

		/* Roughness Remapping */
		gui.material_folder.remove(gui.remap_model);
		gui_remap = [];

		json.chunks.roughness_remap.forEach(function(remap)
		{
			gui_remap.push(remap.name);

			ShaderLibrary.chunks.remap[remap.name] = remap;
			if (remap.default)
				ShaderLibrary.chunks.remap[remap.name].current = true;
			else
				ShaderLibrary.chunks.remap[remap.name].current = false;
			$.ajax(CONFIG.get('SHADER_DIR') + remap.path).done(function(src)
			{
				ShaderLibrary.chunks.remap[remap.name].src = src;
			}).fail(function()
			{
				$.notify("Fragment shader chunk " + remap.path + " not found!", "error");
				return;
			});
		});

		gui.remap_model = gui.material_folder.add(gui.logic, 'roughness_remap', "Roughness Remap", gui_remap);
		gui.remap_model.onFinishChange(gui.remap_model_callback);

  		$.ajax(CONFIG.get('SHADER_DIR') + json.common).done(function(common)
		{
			ShaderLibrary.common = common;
		}).fail(function()
		{
			$.notify("Base fragment shader not found!", "error");
			return;
		});

		$.ajax(CONFIG.get('SHADER_DIR') + json.vertex_shader).done(function(vertex_shader)
		{
			ShaderLibrary.vertex_shader = vertex_shader;
		}).fail(function()
		{
			$.notify("Base vertex shader not found!", "error");
			return;
		});

		$.ajax(CONFIG.get('SHADER_DIR') + json.fragment_shader).done(function(fragment_shader)
		{
			ShaderLibrary.fragment_shader = fragment_shader;
		}).fail(function()
		{
			$.notify("Base fragment shader not found!", "error");
			return;
		});

		// TODO: fragment_stub, fragment chunks
	});
}

function loadCubeMaps()
{
	$.ajaxSetup({beforeSend: function(xhr)
	{
  		if (xhr.overrideMimeType)
  			xhr.overrideMimeType("application/json");
  	}});

	$.getJSON(CONFIG.get('LIBRARY_DIR') + CONFIG.get('CUBEMAP_LIBRARY_PATH')).done(function(json)
	{
		gui.scene_folder.remove(gui.environment);
		gui_env = [];

		json.cubemap.forEach(function(cubemap)
		{
			CubeMapLibrary[cubemap.name] = cubemap;
			CubeMapLibrary[cubemap.name].loaded = false;
			CubeMapLibrary[cubemap.name].current = false;

			if (CubeMapLibrary[cubemap.name].default)
			{
				loadCubeMap(CubeMapLibrary[cubemap.name], function()
				{
					setSkybox(CubeMapLibrary[cubemap.name]);
					CubeMapLibrary[cubemap.name].current = true;
				});
			}

			gui_env.push(cubemap.name);
		});

		gui.environment = gui.scene_folder.add(gui.logic, "environment", "Environment", gui_env);
		gui.environment.onFinishChange(gui.environment_callback);
	});
}

function loadCubeMap(cubemap, callback)
{
	if (cubemap.loaded)
	{
		callback();
		return true;
	}

	if (is_loading_cubemap)
	{
		$.notify("Already loading another environment!", "error");
		return false;
	}

	$.notify("Loading environment " + cubemap.name, "info");

	is_loading_cubemap = true;
	gui.domElement.classList.add('not-active');

	var path = CONFIG.get('CUBEMAP_DIR') + cubemap.dir + "/";
	var format = "." + cubemap.extension;
	var urls = [
		path + 'posx' + format, path + 'negx' + format,
		path + 'posy' + format, path + 'negy' + format,
		path + 'posz' + format, path + 'negz' + format
	];

	cubemap.object = THREE.ImageUtils.loadTextureCube(urls, THREE.CubeReflectionMapping, function()
	{
		cubemap.loaded = true;

		is_loading_cubemap = false;
		gui.domElement.classList.remove('not-active');

		callback();
		$.notify("Environment " + cubemap.name + " loaded!", "success");
	});

	return true;
}

function loadModels()
{
	$.ajaxSetup({beforeSend: function(xhr)
	{
  		if (xhr.overrideMimeType)
  			xhr.overrideMimeType("application/json");
  	}});

	$.getJSON(CONFIG.get('LIBRARY_DIR') + CONFIG.get('MODEL_LIBRARY_PATH')).done(function(json)
	{
		gui.scene_folder.remove(gui.model);
		gui_model = [];

		json.model.forEach(function(model)
		{
			ModelLibrary[model.name] = model;
			ModelLibrary[model.name].loaded = false;
			ModelLibrary[model.name].current = false;

			if (ModelLibrary[model.name].default)
			{
				loadModel(ModelLibrary[model.name], function()
					{
						scene.add(ModelLibrary[model.name].object);
						ModelLibrary[model.name].current = true;

						updateMaterial();
						ModelLibrary[model.name].object.children[0].material = material;
					});
			}

			gui_model.push(model.name);
		});

		gui_model.push("Sphere");
		ModelLibrary['Sphere'] = {
			name: "Sphere",
			loaded: true,
			current: false,
			object: new THREE.Object3D()
		};
		ModelLibrary.Sphere.object.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), material));

		gui.model = gui.scene_folder.add(gui.logic, "model", "Model", gui_model);
		gui.model.onFinishChange(gui.model_callback);
	});
}

function loadModel(model, callback)
{
	if (model.loaded)
	{
		callback();
		return true;
	}

	if (is_loading_model)
	{
		$.notify("Already loading another model!", "error");
		return false;
	}

	$.notify("Loading model " + model.name, "info");

	is_loading_model = true;
	gui.domElement.classList.add('not-active');

	model_loader.load(CONFIG.get('MODEL_DIR') + model.path, function(obj)
	{
		model.loaded = true;

		if (model.remove_root)
			obj = obj.children[0];

		// TODO: Merge every children after the first
		if (model.merge_children)
		{
			obj.children[0].geometry.merge(obj.children[1].geometry);
			obj.remove(obj.children[1]);
		}

		obj.children[0].geometry.mergeVertices();

		obj.children[0].geometry.computeFaceNormals();
		obj.children[0].geometry.computeVertexNormals();

		obj.position.y = model.y_offset;
		obj.scale.set(model.scale.x, model.scale.y, model.scale.z);

		model.object = obj;

		is_loading_model = false;
		gui.domElement.classList.remove('not-active');

		callback();
		$.notify("Model " + model.name + " loaded!", "success");
	});

	return true;
}

function updateMaterial()
{
	material.vertexShader = ShaderLibrary.vertex_shader;
	material.fragmentShader = ShaderLibrary.common + getCurrentDiffuseModel().src + getCurrentDistributionTerm().src +
							  getCurrentShadowingTerm().src + getCurrentFresnelTerm().src + 
							  getCurrentRemapTerm().src + ShaderLibrary.fragment_shader;
	material.needsUpdate = true;
}

function getCurrentModel()
{
	for (var m in ModelLibrary)
	{
		var model = ModelLibrary[m];

		if (model.current)
			return model;
	}
}

function getCurrentEnvironment()
{
	for (var cm in CubeMapLibrary)
	{
		var cubemap = CubeMapLibrary[cm];

		if (cubemap.current)
			return cubemap;
	}
}

function getCurrentDiffuseModel()
{
	for (var dm in ShaderLibrary.chunks.diffuse)
	{
		var diffuse = ShaderLibrary.chunks.diffuse[dm];

		if (diffuse.current)
			return diffuse;
	}
}

function getCurrentDistributionTerm()
{
	for (var dt in ShaderLibrary.chunks.distribution)
	{
		var dist = ShaderLibrary.chunks.distribution[dt];

		if (dist.current)
			return dist;
	}
}

function getCurrentShadowingTerm()
{
	for (var st in ShaderLibrary.chunks.shadowing)
	{
		var shadow = ShaderLibrary.chunks.shadowing[st];

		if (shadow.current)
			return shadow;
	}
}

function getCurrentFresnelTerm()
{
	for (var ft in ShaderLibrary.chunks.fresnel)
	{
		var fresnel = ShaderLibrary.chunks.fresnel[ft];

		if (fresnel.current)
			return fresnel;
	}
}

function getCurrentRemapTerm()
{
	for (var rr in ShaderLibrary.chunks.remap)
	{
		var remap = ShaderLibrary.chunks.remap[rr];

		if (remap.current)
			return remap;
	}
}

function setSkybox(cubemap)
{
	skybox.material.uniforms['tCube'].value = cubemap.object;
}

function kelvinToRGB(temperature)
{
	var temp = temperature / 100.0;

	var red = 255.0;
	if (temp > 66.0)
	{
		red = temp - 60.0;
		red = 329.698727446 * Math.pow(red, -0.1332047592);
		red = THREE.Math.clamp(red, 0.0, 255.0);
	}

	var green = 0.0;
	if (temp <= 66.0)
	{
		green = temp;
		green = 99.4708025861 * Math.log(green) - 161.1195681661;
	}
	else
	{
		green = temp - 60.0;
		green = 288.1221695283 * Math.pow(green, -0.0755148492);
	}
	green = THREE.Math.clamp(green, 0.0, 255.0);

	var blue = 255.0;
	if (temp <= 19.0)
		blue = 0.0;
	else if (temp < 66.0)
	{
		blue = temp - 10.0;
        blue = 138.5177312231 * Math.log(blue) - 305.0447927307;
        blue = THREE.Math.clamp(blue, 0.0, 255.0);
	}

	return new THREE.Vector3(red / 255.0, green / 255.0, blue / 255.0);
}

function specularToF0(specular)
{
	return specular * 0.40;
}

function updateUniforms(current_model)
{
	var normal_matrix = new THREE.Matrix3().getNormalMatrix(current_model.object.matrixWorld);
	material.uniforms.world_normal_matrix.value = normal_matrix;

	material.uniforms.albedo.value.set(gui.logic.albedo[0] / 255.0, gui.logic.albedo[1] / 255.0, gui.logic.albedo[2] / 255.0);
	material.uniforms.roughness.value = gui.logic.roughness;
	material.uniforms.metallic.value = gui.logic.metallic;
	material.uniforms.specular.value = specularToF0(gui.logic.specular);

	material.uniforms.light_color.value = kelvinToRGB(gui.logic.temperature);
	material.uniforms.light_intensity.value = gui.logic.light_intensity;
	material.uniforms.ambient_intensity.value = gui.logic.ambient_intensity;

	var env = getCurrentEnvironment();
	if (env)
		material.uniforms.environment.value = env.object;
}

function render()
{
	requestAnimationFrame(render);
	controls.update();

	if (URL_PARAMS['debug'] == 'true')
	{
		stats.update();
		ext_stats.update(renderer);
	}

	var current_model = getCurrentModel();
	if (current_model)
		updateUniforms(current_model);

	renderer.render(scene, camera);
}

function onWindowResize()
{
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}