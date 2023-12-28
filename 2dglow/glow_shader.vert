#version 430

uniform mat4 p3d_ModelViewProjectionMatrix;
uniform float BLUR_SIZE;
in vec4 p3d_Vertex;
in vec2 p3d_MultiTexCoord0;
out vec2 uv;
out vec2 offset;
void main() {
    offset = vec2(BLUR_SIZE);
    gl_Position = p3d_ModelViewProjectionMatrix * p3d_Vertex * (vec4(1.0, 1.0,0,0) +vec4(offset.x*2,offset.y*2, 1.0,1.0))- vec4(offset.x,offset.y, 0.0,0.0);
    uv = p3d_MultiTexCoord0;
}