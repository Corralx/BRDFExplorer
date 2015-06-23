
// Crytek: Moving to the Next Generation - The Rendering Technology of Ryse [GDC14]
float roughness_remap(float roughness)
{
	return pow(1.0 - (1.0 - roughness) * 0.7, 6.0);
}
