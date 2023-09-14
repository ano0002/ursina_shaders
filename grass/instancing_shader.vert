#version 140

uniform mat4 p3d_ModelViewProjectionMatrix;
in vec4 p3d_Vertex;
in vec2 p3d_MultiTexCoord0;
out vec2 texcoords;
out float depth;
uniform float osg_FrameTime;
uniform vec3 self_pos;
uniform float wind_power;
uniform vec3 cam_pos;
uniform float fog_distance;

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
    
    texcoords = p3d_MultiTexCoord0;
    if (texcoords.y>0.5){
        v.x += cos(rand(vec2(p3d_Vertex.zy))*16+osg_FrameTime) * wind_power;
    }

    gl_Position = p3d_ModelViewProjectionMatrix * (vec4(v + position-self_pos, 1.));
    depth= length(position-self_pos-cam_pos)/fog_distance;
}