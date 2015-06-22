var CONFIG = (function()
{
	var private =
    {
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
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
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
	renderer = new THREE.WebGLRenderer();
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
		this.roughness = 0.1;
		this.albedo = [ 255, 0, 0 ];
		this.temperature = 7000.0;
		this.light_intensity = 1.2;
		this.ambient_intensity = 0.1;
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

	gui.roughness = gui.material_folder.add(gui.logic, 'roughness', "Roughness", 0.0, 1.0);
	gui.albedo = gui.material_folder.addColor(gui.logic, 'albedo', "Albedo");
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
		specular: 		  		{ type: "v3", value: new THREE.Vector3() },
		metallic: 				{ type: "f",  value: 0.0 				 },
		roughness: 				{ type: "f",  value: 0.1 				 },
		environment: 			{ type: "t",  value: null 				 },
		light_color: 			{ type: "v3", value: new THREE.Vector3() },
		light_direction: 		{ type: "v3", value: new THREE.Vector3() },
		light_intensity: 		{ type: "f",  value: 1.2 				 },
		ambient_intensity: 		{ type: "f",  value: 0.1 				 }
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
	if (ShaderLibrary.vertex_shader)
		material.vertexShader = ShaderLibrary.vertex_shader;
	if (ShaderLibrary.fragment_shader)
		material.fragmentShader = ShaderLibrary.fragment_shader;
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

function updateUniforms(current_model)
{
	var normal_matrix = new THREE.Matrix3().getNormalMatrix(current_model.object.matrixWorld);
	material.uniforms.world_normal_matrix.value = normal_matrix;

	material.uniforms.albedo.value.set(gui.logic.albedo[0] / 255.0, gui.logic.albedo[1] / 255.0, gui.logic.albedo[2] / 255.0);
	material.uniforms.roughness.value = gui.logic.roughness;

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