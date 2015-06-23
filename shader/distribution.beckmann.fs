
// Beckmann: The scattering of electromagnetic waves from rough surfaces [Beckmann63]
float distribution(float alpha, float NdH)
{
	float alpha_square = alpha * alpha;
	float NdH_square = NdH * NdH;
	float num = exp((NdH_square - 1.0) / (alpha_square * NdH_square));
	return num / (alpha_square * PI * NdH_square * NdH_square + 0.0001);
}
