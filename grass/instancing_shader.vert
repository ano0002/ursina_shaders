#version 140

uniform mat4 p3d_ModelViewProjectionMatrix;
in vec4 p3d_Vertex;
in vec2 p3d_MultiTexCoord0;
out vec2 texcoords;
uniform vec2 texture_scale;
uniform vec2 texture_offset;
uniform float osg_FrameTime;
uniform int p3d_instanceID;

in vec3 position;
in vec4 rotation;
in vec3 scale;


float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec3 v = p3d_Vertex.xyz * scale;
    vec4 q = rotation;
    v = v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);

    gl_Position = p3d_ModelViewProjectionMatrix * (vec4(v + position, 1.));
    texcoords = (p3d_MultiTexCoord0 * texture_scale) + texture_offset;
}