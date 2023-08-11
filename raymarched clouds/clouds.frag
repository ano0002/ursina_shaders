#version 430

uniform float aspect_ratio;
uniform vec3 camera_pos;
uniform vec3 camera_rot;
uniform float cloud_height;
uniform float sky_height;

uniform float threshold;

uniform float osg_FrameTime;
uniform mat3 p3d_NormalMatrix;
uniform mat3 p3d_NormalMatrixInverse;
uniform sampler2D tex;
uniform sampler2D dtex;

#define PI 3.1415925359
#define TWO_PI 6.2831852
#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURFACE_DIST .01

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);
	
	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}

float get_height(vec2 pos){
    return noise(pos);
}


float sdPlane( vec3 p, vec4 n )
{
    n = normalize(n);
    float height = get_height(p.xz)* -abs(cloud_height);
    // n must be normalized
    return dot(p,n.xyz+vec3(0,height,0)) + n.w;
}  

float GetDist(vec3 p)
{
    return sdPlane(p,vec4(0,-1,0,sky_height));
}

float RayMarch(vec3 ro, vec3 rd) 
{
    float dO = 0.; //Distance Origin
    for(int i=0;i<MAX_STEPS;i++)
    {
        vec3 p = ro + rd * dO;
        float ds = GetDist(p); // ds is Distance Scene
        dO += ds;
        if(dO > MAX_DIST || ds < SURFACE_DIST) break;
    }
    return dO;
}

const mat3 id_three = mat3(1,0,0,0,1,0,0,0,1);


in vec2 uv;
in vec2 adapted_uv;
out vec4 color;
void main()
{
    float depth = texture2D(dtex, adapted_uv).r;
    vec4 background = texture2D(tex, adapted_uv);
    if (depth < 0.9999){
        color = background;
        return;
    }
    vec3 ro = camera_pos;

    /*
    TODO : Fix camera rotation

    vec3 u_camera_rot = vec3(camera_rot.x,camera_rot.z,camera_rot.y);

    vec3 v = cross(u_camera_rot, vec3(0, 0, 1));
    float s = length(v);
    float c = dot(u_camera_rot, vec3(0, 0, 1));

    mat3 skew_symmetric_cross_product = mat3(
        vec3(0, -v.z, v.y),
        vec3(v.z, 0, -v.x),
        vec3(-v.y, v.x, 0)
    );

    mat3 rot = id_three + skew_symmetric_cross_product + skew_symmetric_cross_product * skew_symmetric_cross_product * ((1 - c) / (s * s));

    vec3 up =  vec3(0, 1, 0) * rot ;
    vec3 right = normalize(cross(u_camera_rot, up));
    vec3 rd = normalize(right*uv.x+up*uv.y+u_camera_rot);
    */
    vec3 rd = normalize(vec3(uv.x,uv.y,1));

    float d = RayMarch(ro,rd)/100; // Distance
    if(d >= threshold){
        color = background;
    }
    else{
        color = mix(vec4(1),background,d*10);
    }
}