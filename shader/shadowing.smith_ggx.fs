
float G_GGX(float NdV, float alpha)
{
	float den = alpha * alpha;
	den += NdV * NdV * (1.0 - alpha * alpha);
	den = NdV + sqrt(den);
	return 2.0 * NdV / den;
}

// GGX: Microfacet Models for Refraction through Rough Surfaces [Walter07]
float shadowing(float alpha, float NdV, float NdL, float NdH, float VdH, float LdV)
{
	return G_GGX(NdL, alpha) * G_GGX(NdV, alpha);
}
