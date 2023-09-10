#version 430

vec2 rotate(vec2 v, float a) {
	float s = sin(a);
	float c = cos(a);
	mat2 m = mat2(c, s, -s, c);
	return m * v;
}

float random (float val) {
    return fract(sin(dot(vec2(val),
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

float oilersin(float x, float w, float t, float speed){
    float phi = speed*2/w;
    return exp(sin(x*w+t*phi)-1);
}

float sum_of_sines(vec2 uv, float resolution, float osg_FrameTime, float speed){
    float value = 0.0;
    vec2 dir = vec2(1,0);
    for(int i = 0; i < resolution; i++){
        float w = pow(1.18,i);
        value += oilersin(uv.x*dir.x+uv.y*dir.y,w,osg_FrameTime,speed)*pow(0.82,i);
        dir = rotate(dir,240);
    }
    return value;
}

vec3 sum_of_sin_derivatives(vec2 uv, float resolution, float osg_FrameTime, float speed){
    vec3 value = vec3(0.0);
    vec2 dir = vec2(1,0);
    for(int i = 0; i < resolution; i++){
        float w = pow(1.18,i);
        float phi = speed*2/w;
        float sin_value = oilersin(uv.x*dir.x+uv.y*dir.y,w,osg_FrameTime,speed);
        vec2 partial_derivative = w*dir* pow(0.82,i) * sin_value * cos((uv.x*dir.x+uv.y*dir.y)*w+osg_FrameTime*phi);
        vec3 normal = vec3(partial_derivative.x,0,partial_derivative.y);
        value += normal;
        dir = rotate(dir,240);
    }
    return normalize(value);
}

// Input from the vertex shader


uniform mat4 p3d_ModelViewProjectionMatrix;
uniform float osg_FrameTime;
uniform int resolution;
uniform float amplitude;
uniform float speed;
in vec4 p3d_Vertex;
in vec2 p3d_MultiTexCoord0;
out vec2 uv;
out vec3 world_normal;
void main() {
    float offset = amplitude*sum_of_sines(p3d_MultiTexCoord0*resolution,resolution,osg_FrameTime,speed);
    gl_Position = p3d_ModelViewProjectionMatrix * p3d_Vertex+vec4(0,offset,0,0);
    world_normal = sum_of_sin_derivatives(p3d_MultiTexCoord0*resolution,resolution,osg_FrameTime,speed);
    uv = p3d_MultiTexCoord0;
}