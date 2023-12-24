#version 140

uniform sampler2D p3d_Texture0;
uniform vec4 p3d_ColorScale;
uniform float avg_precision;
uniform float brightness;
uniform float atmosphere_light;
uniform float palette_size;
uniform vec3 light_direction;
in vec2 texcoord;
in vec3 world_normal;
out vec4 fragColor;

float apply_palette(float brightness) {
    float interval = 1.0 / float(palette_size - 1);
    // Quantize brightness to the nearest value in the palette
    float quantized = max(0,min(1,floor(brightness * (palette_size - 1) + 0.5) * interval));
    return quantized*(1-atmosphere_light) + atmosphere_light;
}
void main() {
    //Get the average color of the texture using avg_precision**2 points
    vec4 avg_color = vec4(0);
    for (int i = 0; i < int(avg_precision); i++) {
        for (int j = 0; j < int(avg_precision); j++) {
            vec2 offset = vec2(float(i)/avg_precision, float(j)/avg_precision);
            vec4 color = texture(p3d_Texture0, offset);
            avg_color += vec4(color.rgb/((avg_precision*avg_precision)/color.a),1);
        }
    }
    avg_color *= brightness;
    vec4 norm = vec4(vec3(apply_palette(dot(world_normal,normalize(light_direction*-1)))), 1);
    vec4 color = avg_color * p3d_ColorScale * norm;
    fragColor = vec4(color.rgb, texture(p3d_Texture0, texcoord).a) ;

}