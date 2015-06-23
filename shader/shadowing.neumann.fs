
// Neumann: Compact metallic reflectance models [Neumann99]
float shadowing(float alpha, float NdV, float NdL, float NdH, float VdH, float LdV)
{
	return (NdL * NdV) / max(NdL, NdV);
}
