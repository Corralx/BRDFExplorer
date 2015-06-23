
// Cook-Torrance: A Reflectance Model for Computer Graphics [CookTorrance82]
vec3 fresnel(vec3 specular, float VdH)
{
	vec3 n = (1.0 + sqrt(specular)) / (1.0 - sqrt(specular));
    vec3 g = sqrt(n * n + VdH * VdH - 1.0);

    vec3 part1 = (g - VdH) / (g + VdH);
    vec3 part2 = ((g + VdH) * VdH - 1.0) / ((g - VdH) * VdH + 1.0);

    return max(vec3(0.0), 0.5 * part1 * part1 * (1.0 + part2 * part2));
}
