#version 430

#define PI 3.1415926535897932384626433832795

float atan2(in float y, in float x)
{
    bool s = (abs(x) > abs(y));
    return mix(PI/2.0 - atan(x,y), atan(y,x), s);
}

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

in vec2 uv;
in vec3 world_normal;
uniform float osg_FrameTime;
uniform int resolution;
uniform float amplitude;
uniform float speed;
uniform vec3 waterColor;
uniform vec3 lightDir;
uniform vec3 lightColor;
uniform vec3 cameraDir;
uniform vec3 cameraPos;
uniform float ambient;
uniform sampler2D reflectionTexture;
out vec4 fragColor;
void main()
{
    float offset = amplitude*sum_of_sines(uv*resolution,resolution,osg_FrameTime,speed);
  
    vec3 pos = vec3(uv.x,uv.y,offset);
    vec3 viewDir = normalize(cameraPos-pos);

    //Ambient
    vec3 color = ambient*waterColor;

    // Diffuse
    float lambert = max(dot(world_normal,lightDir),0.0);
    color += vec3(lambert)*waterColor;

    // Specular
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(world_normal, halfwayDir), 0.0), 16.0);
    color += vec3(spec)*lightColor;

    //Reflection
    vec3 reflectDir = 2.0 * dot(viewDir, world_normal) * world_normal - viewDir;
    
    //transform to uv space
    float lon = atan2(reflectDir.x, reflectDir.y);
    float lat = atan2(reflectDir.z, sqrt(reflectDir.x*reflectDir.x + reflectDir.y*reflectDir.y));
    float u = (lon + PI)/(2*PI);
    float v = (log(tan(lat/2 + PI/4)) + PI)/(2*PI);
    vec3 reflectColor = texture(reflectionTexture,vec2(u,v)).rgb;

    //Fresnel
    float fresnel = pow(1.0 - dot(world_normal, viewDir), 5.0);
    color += reflectColor;


    // Output to screen
    fragColor =  vec4(color,1.0);
}