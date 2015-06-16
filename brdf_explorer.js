var CONFIG = (function()
{
	var private =
    {
        'FOV_Y': 60.0,
        'NEAR' : 0.1,
        'FAR' : 100,
        'SHADER_LIBRARY_PATH' : 'shader_lib.json',
        'SHADER_CHUNK_DIR' : 'shader/',
        'CUBEMAP_DIR' : 'img/',
        'CUBEMAP_LIBRARY_PATH' : 'cubemap_lib.json'
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

	camera = new THREE.PerspectiveCamera(CONFIG.get('FOV_Y'), window.innerWidth / window.innerHeight, CONFIG.get('NEAR'), CONFIG.get('FAR'));
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

	(new THREE.AssimpJSONLoader()).load("model/mitsuba_min.json", function(mesh)
	{
		var obj = mesh.children[0];
		console.log(obj);
		obj.scale.set(0.04, 0.04, 0.04);
		obj.position.y = -0.5;
		scene.add(obj);
	});
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
	
		scene.add(new THREE.Mesh(new THREE.BoxGeometry(50, 50, 50), materialSkyBox));
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