
// Implicit: Background: Physics and Math of Shading [Siggraph13]
float shadowing(float alpha, float NdV, float NdL, float NdH, float VdH, float LdV)
{
	return NdL * NdV;
}
