var CONFIG = (function()
{
	var private =
    {
        'FOV_Y': 60.0,
        'NEAR_PLANE': 0.1,
        'FAR_PLANE': 1000,
        'SHADER_LIBRARY_PATH': 'shader_lib.json',
        'SHADER_CHUNK_DIR': 'shader/',
        'CUBEMAP_DIR': 'img/',
        'CUBEMAP_LIBRARY_PATH': 'cubemap_lib.json',
        'MODEL_DIR': 'model/'
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

var renderer, scene, camera, stats, ext_stats, controls, reflection_cube;

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

	controls = new THREE.OrbitControls(camera);
	controls.noZoom = true;

	initGUI();
	initStats();
	loadShaders();

	/*
	var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
	var material = new THREE.MeshBasicMaterial({color: 0x00ff00});
	var cube = new THREE.Mesh(geometry, material);
	scene.add(cube);
	*/

	loadCubeMap();

	/* Stanford Dragon
	(new THREE.AssimpJSONLoader()).load("model/dragon_low_min.json", function(mesh)
	{
		console.log(mesh.children[0]);
		mesh.children[0].scale.set(0.1, 0.1, 0.1);
		mesh.children[0].position.y = -0.45;
		mesh.children[0].children[0].geometry.merge(mesh.children[0].children[1].geometry);
		mesh.children[0].remove(mesh.children[0].children[1]);
		mesh.children[0].children[0].geometry.computeFaceNormals();
		mesh.children[0].children[0].geometry.computeVertexNormals();
		mesh.children[0].children[0].material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
		scene.add(new THREE.DirectionalLight(new THREE.Vector3(-50.0, -50.0, -50.0), 1.0));
		scene.add(mesh.children[0]);
	});
	*/

	/* Stanford Buddha
	(new THREE.AssimpJSONLoader()).load("model/buddha_low_min.json", function(mesh)
	{
		console.log(mesh.children[0]);
		mesh.children[0].scale.set(0.012, 0.012, 0.012);
		mesh.children[0].position.y = -0.55;
		mesh.children[0].children[0].geometry.computeFaceNormals();
		mesh.children[0].children[0].geometry.computeVertexNormals();
		mesh.children[0].children[0].material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
		scene.add(new THREE.DirectionalLight(new THREE.Vector3(-50.0, -50.0, -50.0), 1.0));
		scene.add(mesh.children[0]);
	});
	*/

	/* Stanford Lucy */
	(new THREE.AssimpJSONLoader()).load("model/lucy_min.json", function(mesh)
	{
		console.log(mesh.children[0]);
		mesh.children[0].scale.set(0.004, 0.004, 0.004);
		mesh.children[0].position.y = -0.65;
		mesh.children[0].children[0].geometry.computeFaceNormals();
		mesh.children[0].children[0].geometry.computeVertexNormals();
		mesh.children[0].children[0].material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
		scene.add(new THREE.DirectionalLight(new THREE.Vector3(-50.0, -50.0, -50.0), 1.0));
		scene.add(mesh.children[0]);
	});

	/* Mitsuba
	(new THREE.AssimpJSONLoader()).load("model/mitsuba_min.json", function(mesh)
	{
		console.log(mesh.children[0]);
		mesh.children[0].scale.set(0.04, 0.04, 0.04);
		mesh.children[0].position.y = -0.55;
		mesh.children[0].children[0].geometry.merge(mesh.children[0].children[1].geometry);
		mesh.children[0].remove(mesh.children[0].children[1]);
		mesh.children[0].children[0].geometry.computeFaceNormals();
		mesh.children[0].children[0].geometry.computeVertexNormals();
		mesh.children[0].children[0].material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
		scene.add(new THREE.DirectionalLight(new THREE.Vector3(-50.0, -50.0, -50.0), 1.0));
		scene.add(mesh.children[0]);
	});
	*/
}

function initGUI()
{
	// TODO
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

function loadShaders()
{
	$.ajaxSetup({beforeSend: function(xhr)
	{
  		if (xhr.overrideMimeType)
  			xhr.overrideMimeType("application/json");
  	}});

	$.getJSON(CONFIG.get('SHADER_LIBRARY_PATH')).done(function(json)
	{
		var total_chunks = json.chunks.length;
		var loaded_chunks = 0;

		$.ajaxSetup({beforeSend: function(xhr)
		{
  			if (xhr.overrideMimeType)
  				xhr.overrideMimeType("text/plain");
  		}});

		json.chunks.forEach(function(chunk)
		{
			$.ajax(CONFIG.get('SHADER_CHUNK_DIR') + chunk).done(function(shader_chunk)
			{
				loaded_chunks++;
				if (loaded_chunks == total_chunks)
					render();
			});
		});
	});
}

// TODO: Account for every resources during load
function loadCubeMap()
{
	$.ajaxSetup({beforeSend: function(xhr)
	{
  		if (xhr.overrideMimeType)
  			xhr.overrideMimeType("application/json");
  	}});

	$.getJSON(CONFIG.get('CUBEMAP_LIBRARY_PATH')).done(function(json)
	{
		console.log(json);
		json.cubemap.forEach(function(cubemap)
		{
			if (cubemap.default)
				console.log(cubemap.name);
		});
	});

	var path = CONFIG.get('CUBEMAP_DIR') + "coit_tower/";
	var format = '.jpg';
	var urls = [
		path + 'posx' + format, path + 'negx' + format,
		path + 'posy' + format, path + 'negy' + format,
		path + 'posz' + format, path + 'negz' + format
	];

	reflection_cube = THREE.ImageUtils.loadTextureCube(urls, THREE.CubeReflectionMapping, function()
	{
		var shader = THREE.ShaderLib["cube"];
		shader.uniforms["tCube"].value = reflection_cube;
			
		var materialSkyBox = new THREE.ShaderMaterial(
		{
			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader,
			uniforms: shader.uniforms,
			depthWrite: false,
			side: THREE.BackSide
		});
	
		scene.add(new THREE.Mesh(new THREE.BoxGeometry(500, 500, 500), materialSkyBox));
	});
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

	renderer.setSize( window.innerWidth, window.innerHeight );
}