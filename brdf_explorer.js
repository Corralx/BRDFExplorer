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

var renderer, scene, camera, stats, ext_stats, controls, reflection_cube, model_loader, is_loading_model, is_loading_cubemap, gui, skybox;

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

	model_loader = new THREE.AssimpJSONLoader();
	is_loading_model = false;
	is_loading_cubemap = false;

	initGUI();
	initStats();
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
	};

	gui = new dat.GUI();
	gui.logic = new gui_logic();

	gui.model = gui.add(gui.logic, 'model', []);
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
		});
	};

	gui.environment = gui.add(gui.logic, 'environment', []);
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

		json.chunks.forEach(function(chunk)
		{
			$.ajax(CONFIG.get('SHADER_DIR') + chunk).done(function(shader_chunk)
			{
				// TODO
			});
		});
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
		gui.remove(gui.environment);
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

		gui.environment = gui.add(gui.logic, "environment", gui_env);
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
		gui.remove(gui.model);
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
					});
			}

			gui_model.push(model.name);
		});

		gui.model = gui.add(gui.logic, "model", gui_model);
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

		obj.children[0].geometry.computeFaceNormals();
		obj.children[0].geometry.computeVertexNormals();

		obj.position.y = model.y_offset;
		obj.scale.set(model.scale.x, model.scale.y, model.scale.z);

		is_loading_model = false;
		gui.domElement.classList.remove('not-active');

		model.object = obj;

		callback();

		$.notify("Model " + model.name + " loaded!", "success");
	});

	return true;
}

function getCurrentModel()
{
	for (var m in ModelLibrary)
	{
		var model = ModelLibrary[m];

		if (model.current)
			return model;
	}

	$.notify("No current model found!", "error");
}

function getCurrentEnvironment()
{
	for (var cm in CubeMapLibrary)
	{
		var cubemap = CubeMapLibrary[cm];

		if (cubemap.current)
			return cubemap;
	}

	$.notify("No current environment found!", "error");
}

function setSkybox(cubemap)
{
	skybox.material.uniforms['tCube'].value = cubemap.object;
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

	renderer.render(scene, camera);
}

function onWindowResize()
{
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}