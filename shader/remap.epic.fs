
// Epic Games: Real Shading in Unreal Engine 4 [Siggraph13]
float roughness_remap(float roughness)
{
	return max(roughness * roughness, 0.0001);
}
