
float G_beckmann(float NdV, float alpha)
{
	float c = NdV / (alpha * sqrt(1.0 - NdV * NdV));
	if (c >= 1.6)
	{
		return 1.0;
	}
	else
	{
        float c2 = c * c;
        return (3.535 * c + 2.181 * c2) / (1.0 + 2.276 * c + 2.577 * c2);
    }
}

// Beckmann: Microfacet Models for Refraction through Rough Surfaces [Walter07]
float shadowing(float alpha, float NdV, float NdL, float NdH, float VdH, float LdV)
{
	return G_beckmann(NdL, alpha) * G_beckmann(NdV, alpha);
}
