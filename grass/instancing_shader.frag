
#version 140

uniform sampler2D p3d_Texture0;
uniform vec4 p3d_ColorScale;
uniform vec3 self_pos;
uniform vec3 fog_color;
in float depth;
in vec2 texcoords;
out vec4 fragColor;

void main() {
    vec4 base_color = texture(p3d_Texture0, texcoords) * p3d_ColorScale;
    vec4 color = mix(base_color, vec4(fog_color/255,base_color.a), depth);
    fragColor = color.rgba;
}