var CONFIG = (function()
{
     var private =
     {
         'FOV_Y': 60.0,
         'NEAR' : 0.1,
         'FAR' : 100,
         'SHADER_LIBRARY_PATH' : 'shader_lib.json',
         'SHADER_CHUNK_DIR' : 'shader/'
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

var renderer, scene, camera, stats, ext_stats;

function init()
{
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	renderer.setClearColor(0x00ff00, 1.0);

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(CONFIG.get('FOV_Y'), window.innerWidth / window.innerHeight, CONFIG.get('NEAR'), CONFIG.get('FAR'));
	window.addEventListener('resize', onWindowResize, false);
	scene.add(camera);
	camera.position.z = 3;

	initGUI();
	initStats();
	loadShaders();

	var geometry = new THREE.BoxGeometry(1, 1, 1);
	var material = new THREE.MeshBasicMaterial({color: 0xffffff});
	var cube = new THREE.Mesh(geometry, material);
	scene.add(cube);
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

function render()
{
	requestAnimationFrame(render);

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