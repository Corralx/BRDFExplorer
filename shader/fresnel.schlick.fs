
// Schlick Approximation: An Inexpensive BRDF Model for Physically-based Rendering [Schlick94]
vec3 fresnel(vec3 specular, float VdH)
{
	return specular + (1.0 - specular) * pow(1.0 - VdH, 5.0);
}
