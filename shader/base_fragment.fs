
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

// Microfacet Models for Refraction through Rough Surfaces [Walter07]
float specular_D_GGX(float alpha, float NdH)
{
	float alpha_square = alpha * alpha;
	float NdH_square = NdH * NdH;
	float den = NdH_square * (alpha_square - 1.0) + 1.0;
	den = pow(den, 2.0) / PI;
	return alpha_square / den;
}

float specular_G1(float NdV, float k)
{
	return NdV / (NdV * (1.0 - k) + k);
}

// An Inexpensive BRDF Model for Physically-based Rendering [Schlick94]
float specular_G_Smith_Schlick(float alpha, float NdV, float NdL, float NdH, float VdH, float LdV)
{
	float k = pow(0.8 + 0.5 * alpha, 2.0) / 2.0;
	return specular_G1(NdL, k) * specular_G1(NdV, k);
}

// An Inexpensive BRDF Model for Physically-based Rendering [Schlick94]
vec3 specular_F_Schlick(vec3 specular, float VdH)
{
	return specular + (1.0 - specular) * pow(1.0 - VdH, 5.0);
}

// A Reflectance Model for Computer Graphics [Cook82]
vec3 specular_cook_torrance(vec3 specular, vec3 h, vec3 v, vec3 l, float roughness, float NdL, float NdV, float NdH, float VdH, float LdV)
{
	// Moving to the Next Generation - The Rendering Technology of Ryse [GDC 14]
	float alpha = pow(1.0 - (1.0 - roughness) * 0.7, 6.0);

	return (specular_D_GGX(alpha, NdH) * specular_G_Smith_Schlick(alpha, NdV, NdL, NdH, VdH, LdV)) * specular_F_Schlick(specular, VdH) / (4.0 * NdL * NdV + 0.0001);
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
