
// GGX: Microfacet Models for Refraction through Rough Surfaces [Walter07]
float distribution(float alpha, float NdH)
{
	float alpha_square = alpha * alpha;
	float NdH_square = NdH * NdH;
	float den = NdH_square * (alpha_square - 1.0) + 1.0;
	den = pow(den, 2.0) / PI;
	return alpha_square / den;
}
