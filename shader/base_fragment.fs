
void main()
{
	vec3 normal = normalize(world_normal);
	vec3 view_vector = normalize(world_position - cameraPosition);
	vec3 camera_vector = -view_vector;
	vec3 light_vector = normalize(-light_direction);
	vec3 half_vector = normalize(light_vector + camera_vector);

	float NdL = saturate(dot(normal, light_vector));
    float NdV = saturate(dot(normal, camera_vector));
    float NdH = saturate(dot(normal, half_vector));
    float VdH = saturate(dot(camera_vector, half_vector));
    float LdV = saturate(dot(light_vector, camera_vector));

	float alpha = roughness_remap(roughness);

	// Cook-Torrance: A Reflectance Model for Computer Graphics [Cook82]
    vec3 diffuse_comp = diffuse(albedo, NdL, NdV, VdH, roughness);
    vec3 specular_comp = distribution(alpha, NdH) * shadowing(alpha, NdV, NdL, NdH, VdH, LdV) * fresnel(specular, VdH) / (4.0 * NdL * NdV + 0.0001);

    vec3 color = (diffuse_comp * (1.0 - specular_comp) + specular_comp) * light_color * NdL * light_intensity + albedo * ambient_intensity;
    gl_FragColor = pow(vec4(color, 1.0), vec4(1.0 / GAMMA));
}
