uniform vec3 albedo;
uniform vec3 specular_color;
uniform float specular;
uniform float metallic;
uniform float roughness;

varying vec3 world_position;
varying vec3 world_normal;
varying vec3 _normal;

void main()
{
	gl_FragColor = vec4(normalize(world_normal), 1.0);
}
