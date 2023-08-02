#version 430

uniform mat4 p3d_ModelViewProjectionMatrix;
uniform float outline_thickness;
uniform vec2 sprite_size;
in vec4 p3d_Vertex;
in vec2 p3d_MultiTexCoord0;
out vec2 uv;
out vec2 offset;
void main() {
    offset = vec2(outline_thickness/sprite_size.x, outline_thickness/sprite_size.y);
    gl_Position = p3d_ModelViewProjectionMatrix * p3d_Vertex * (vec4(1.0, 1.0,0,0) +vec4(offset.x*2,offset.y*2, 1.0,1.0));
    uv = p3d_MultiTexCoord0;
}