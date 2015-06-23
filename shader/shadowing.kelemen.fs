
// Kelemen: A microfacet based coupled specular-matte brdf model with importance sampling [Kelemen01]
float shadowing(float alpha, float NdV, float NdL, float NdH, float VdH, float LdV)
{
	return NdL * NdV / (VdH * VdH);
}
