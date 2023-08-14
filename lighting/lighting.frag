#version 430

uniform sampler2D p3d_Texture0;
uniform sampler2D normal_map;
uniform sampler2D roughness_map;

uniform vec3 light_pos;
uniform vec3 camera_pos;

uniform vec3 light_color;

const float PI = 3.14159265359;

in vec2 uv;
in vec3 pos;
out vec4 fragColor;
void main()
{
    vec3 albedo     = texture(p3d_Texture0, uv).rgb;
    vec3 normal     = texture(normal_map, uv).rgb;
    float roughness = texture(roughness_map, uv).r;
    
    //Ambient
    vec3 ambient = vec3(0.03) * albedo;

    //Diffuse
    vec3 light_dir = normalize(light_pos - pos);
    float NdotL = max(dot(normal, light_dir), 0.0);
    vec3 diffuse = NdotL * light_color;

    //Specular
    vec3 view_dir = normalize(camera_pos - pos);
    vec3 halfway_dir = normalize(light_dir + view_dir);
    float NdotH = max(dot(normal, halfway_dir), 0.0);
    float roughness2 = roughness * roughness;
    float NdotH2 = NdotH * NdotH;
    float denom = (NdotH2 * (roughness2 - 1.0) + 1.0);
    float D = roughness2 / (PI * denom * denom);
    float VdotH = max(dot(view_dir, halfway_dir), 0.0);
    float VdotH5 = VdotH * VdotH * VdotH * VdotH * VdotH;
    float Vis = ((1.0 - roughness) * VdotH5 + roughness);
    float Fc = pow(1.0 - VdotH, 5.0);
    vec3 specular = (D * Vis * Fc) * light_color;

    vec3 color = (ambient + diffuse + specular) * albedo;

    fragColor = vec4(color, 1.0);
} 