
// Cook-Torrance: A Reflectance Model for Computer Graphics [CookTorrance82]
float shadowing(float alpha, float NdV, float NdL, float NdH, float VdH, float LdV)
{
	return min(1.0, min(2.0 * NdH * NdV / VdH, 2.0 * NdH * NdL / VdH));
}
