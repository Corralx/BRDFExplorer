
// Burley: Physically-based Shading at Disney [SIGGRAPH12]
vec3 diffuse(vec3 albedo, float NdL, float NdV, float VdH, float roughness)
{
	float FD90 = (0.5 + 2.0 * VdH * VdH) * roughness;
	FD90 -= 1.0;
	float inv = 1.0 - NdL;
	float pow5 = pow(inv, 5.0);
	float FL = 1.0 + FD90 * pow5;
	float FV = 1.0 + FD90 * pow5;
	return albedo * FL * FV / PI;
}
