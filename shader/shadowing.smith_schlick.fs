
float specular_G1(float NdV, float k)
{
	return NdV / (NdV * (1.0 - k) + k);
}

// Smith-Schlick: An Inexpensive BRDF Model for Physically-based Rendering [Schlick94]
float shadowing(float alpha, float NdV, float NdL, float NdH, float VdH, float LdV)
{
	float k = pow(0.8 + 0.5 * alpha, 2.0) / 2.0;
	return specular_G1(NdL, k) * specular_G1(NdV, k);
}
