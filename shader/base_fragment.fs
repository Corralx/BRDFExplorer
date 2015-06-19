#define PI 3.14159265359

uniform vec3 albedo;
uniform vec3 specular;
uniform float metallic;
uniform float roughness;
uniform samplerCube environment;

uniform vec3 light_color;
uniform vec3 light_direction;
uniform float light_intensity;
uniform float ambient_intensity;

varying vec3 world_position;
varying vec3 world_normal;

float saturate(float v)
{
	return clamp(v, 0.0, 1.0);
}

vec2 saturate(vec2 v)
{
	return clamp(v, 0.0, 1.0);
}

vec3 saturate(vec3 v)
{
	return clamp(v, 0.0, 1.0);
}

vec4 saturate(vec4 v)
{
	return clamp(v, 0.0, 1.0);
}

void main()
{
	vec3 normal = normalize(world_normal);
	vec3 view_vector = normalize(world_position - cameraPosition);
	vec3 camera_vector = -view_vector;
	vec3 light_vector = normalize(-light_direction);

	float NdL = saturate(dot(normal, light_vector));
    float NdV = saturate(dot(normal, camera_vector));
    vec3 h = normalize(light_vector + camera_vector);
    float NdH = saturate(dot(normal, h));
    float VdH = saturate(dot(camera_vector, h));
    float LdV = saturate(dot(light_vector, camera_vector));
    float a = max(0.001, roughness * roughness);

    gl_FragColor = vec4(albedo, 1.0);
}
