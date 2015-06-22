
uniform vec3 albedo;
uniform vec3 specular;
uniform float metallic;
uniform float roughness;
uniform samplerCube environment;

uniform vec3 light_color;
uniform vec3 light_direction;
uniform float light_intensity;
uniform float ambient_intensity;

varying vec3 world_position;
varying vec3 world_normal;

vec3 diffuse_lambert(vec3 albedo, float NdL, float NdV, float VdH, float roughness)
{
	return albedo / PI;
}

vec3 diffuse_burley(vec3 albedo, float NdL, float NdV, float VdH, float roughness)
{
	float FD90 = (0.5 + 2.0 * VdH * VdH) * roughness;
	FD90 -= 1.0;
	float inv = 1.0 - NdL;
	float pow5 = pow(inv, 5.0);
	float FL = 1.0 + FD90 * pow5;
	float FV = 1.0 + FD90 * pow5;
	return albedo * FL * FV / PI;
}

vec3 diffuse_oren_nayar(vec3 albedo, float NdL, float NdV, float VdH, float roughness)
{
	float sigma = max(0.001, roughness * roughness);
	float A = 1.0 - (0.5 * sigma / (sigma + 0.57));
	float B = 0.45 * sigma / (sigma + 0.09);
	float theta_i = acos(NdL);
	float theta_r = acos(NdV);
	float alpha = max(theta_i, theta_r);
	float beta = min(theta_i, theta_r);
	return albedo / PI * (A + B * sin(alpha) * tan(beta) * max(0.0, cos(NdL - NdV)));
}

vec3 specular_cook_torrance(vec3 specular, vec3 h, vec3 v, vec3 l, float roughness, float NdL, float NdV, float NdH, float VdH, float LdV)
{
	//return (specular_D(roughness, NdH) * specular_G(roughness, NdV, NdL, NdH, VdH, LdV)) * specular_F(specular, v, h) / (4.0f * NdL * NdV + 0.0001f);
	return vec3(0.0);
}

void main()
{
	vec3 normal = normalize(world_normal);
	vec3 view_vector = normalize(world_position - cameraPosition);
	vec3 camera_vector = -view_vector;
	vec3 light_vector = normalize(-light_direction);

	float NdL = saturate(dot(normal, light_vector));
    float NdV = saturate(dot(normal, camera_vector));
    vec3 h = normalize(light_vector + camera_vector);
    float NdH = saturate(dot(normal, h));
    float VdH = saturate(dot(camera_vector, h));
    float LdV = saturate(dot(light_vector, camera_vector));

    vec3 diffuse_comp = diffuse_burley(albedo, NdL, NdV, VdH, roughness);
    vec3 specular_comp = specular_cook_torrance(specular, h, camera_vector, light_vector, roughness, NdL, NdV, NdH, VdH, LdV);

    vec3 color = (diffuse_comp * (1.0 - specular_comp) + specular_comp) * light_color * NdL * light_intensity + albedo * ambient_intensity;
    gl_FragColor = pow(vec4(color, 1.0), vec4(1.0 / GAMMA));
}
