uniform mat3 world_normal_matrix;

varying vec3 world_position;
varying vec3 world_normal;

void main()
{
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	world_normal = normalize(world_normal_matrix * normal);
	world_position = (modelMatrix * vec4(position, 1.0)).xyz;
}