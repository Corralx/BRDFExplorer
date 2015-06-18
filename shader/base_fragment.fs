uniform vec3 albedo;
uniform vec3 specular_color;
uniform float specular;
uniform float metallic;
uniform float roughness;
uniform samplerCube environment;

varying vec3 world_position;
varying vec3 world_normal;

void main()
{
	vec3 view_direction = normalize(world_position - cameraPosition);
	vec3 reflection = reflect(view_direction, world_normal);
	gl_FragColor = textureCube(environment, reflection);
}
