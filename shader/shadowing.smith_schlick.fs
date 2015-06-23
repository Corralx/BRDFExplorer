
float G1(float NdV, float k)
{
	return NdV / (NdV * (1.0 - k) + k);
}

// Smith-Schlick: An Inexpensive BRDF Model for Physically-based Rendering [Schlick94]
float shadowing(float alpha, float NdV, float NdL, float NdH, float VdH, float LdV)
{
	//float k = alpha * sqrt(2.0 / PI); // Schlick remap
	//float k = alpha / 2.0; // Epic remap
	float k = pow(0.8 + 0.5 * alpha, 2.0) / 2.0; // Crytek remap
	return G1(NdL, k) * G1(NdV, k);
}
