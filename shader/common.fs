
uniform vec3 albedo;
uniform float specular;
uniform float metallic;
uniform float roughness;
uniform samplerCube environment;

uniform vec3 light_color;
uniform vec3 light_direction;
uniform float light_intensity;
uniform float ambient_intensity;

varying vec3 world_position;
varying vec3 world_normal;

#define PI 3.14159265359
#define GAMMA 2.2

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
