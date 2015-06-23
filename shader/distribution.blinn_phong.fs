
// Blinn-Phong: Models of light reflection for computer synthesized pictures [Blinn77]
float distribution(float alpha, float NdH)
{
	float alpha_square = alpha * alpha;
	float exp = 2.0 / alpha_square - 2.0;
	return pow(NdH, exp) / (PI * alpha_square);
}
