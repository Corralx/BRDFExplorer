
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
