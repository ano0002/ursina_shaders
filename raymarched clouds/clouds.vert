#version 430

uniform mat4 p3d_ModelViewProjectionMatrix;
uniform float aspect_ratio;
in vec4 p3d_Vertex;
in vec2 p3d_MultiTexCoord0;
out vec2 uv;
out vec2 adapted_uv;
void main() {
    gl_Position = p3d_ModelViewProjectionMatrix * p3d_Vertex;
    uv = p3d_MultiTexCoord0*2-1;
    uv.x *= aspect_ratio;
    adapted_uv = p3d_MultiTexCoord0;
}