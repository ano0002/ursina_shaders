#version 430

uniform mat4 p3d_ModelViewProjectionMatrix;

uniform sampler2D height_map;
uniform float height_scale;

in vec4 p3d_Vertex;
in vec2 p3d_MultiTexCoord0;
out vec2 uv;
out vec3 pos;
void main() {
    float offset = texture(height_map, p3d_MultiTexCoord0).r * height_scale;
    pos = (p3d_Vertex+vec4(vec3(0,offset,0),0)).xzy;
    gl_Position = p3d_ModelViewProjectionMatrix * vec4(pos.xzy,1);
    uv = p3d_MultiTexCoord0;
}