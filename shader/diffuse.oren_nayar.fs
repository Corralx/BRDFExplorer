
// Oren-Nayar: Generalization of Lambert's Reflectance Model [SIGGRAPH94]
vec3 diffuse(vec3 albedo, float NdL, float NdV, float VdH, float roughness)
{
	float sigma = max(0.001, roughness * roughness);
	float A = 1.0 - (0.5 * sigma / (sigma + 0.57));
	float B = 0.45 * sigma / (sigma + 0.09);
	float theta_i = acos(NdL);
	float theta_r = acos(NdV);
	float alpha = max(theta_i, theta_r);
	float beta = min(theta_i, theta_r);
	return albedo / PI * (A + B * sin(alpha) * tan(beta) * max(0.0, cos(NdL - NdV)));
}
