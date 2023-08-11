#version 430

uniform float aspect_ratio;
uniform vec3 camera_pos;
uniform vec3 camera_rot;

uniform vec2 window_size;

uniform float cloud_height;
uniform float density;
uniform float sky_height;
uniform sampler2D background_tex;

uniform vec3 light_dir;

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

// Some useful functions
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

//
// Description : GLSL 2D simplex noise function
//      Author : Ian McEwan, Ashima Arts
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License :
//  Copyright (C) 2011 Ashima Arts. All rights reserved.
//  Distributed under the MIT License. See LICENSE file.
//  https://github.com/ashima/webgl-noise
//
float snoise(vec2 v) {

    // Precompute values for skewed triangular grid
    const vec4 C = vec4(0.211324865405187,
                        // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,
                        // 0.5*(sqrt(3.0)-1.0)
                        -0.577350269189626,
                        // -1.0 + 2.0 * C.x
                        0.024390243902439);
                        // 1.0 / 41.0

    // First corner (x0)
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    // Other two corners (x1, x2)
    vec2 i1 = vec2(0.0);
    i1 = (x0.x > x0.y)? vec2(1.0, 0.0):vec2(0.0, 1.0);
    vec2 x1 = x0.xy + C.xx - i1;
    vec2 x2 = x0.xy + C.zz;

    // Do some permutations to avoid
    // truncation effects in permutation
    i = mod289(i);
    vec3 p = permute(
            permute( i.y + vec3(0.0, i1.y, 1.0))
                + i.x + vec3(0.0, i1.x, 1.0 ));

    vec3 m = max(0.5 - vec3(
                        dot(x0,x0),
                        dot(x1,x1),
                        dot(x2,x2)
                        ), 0.0);

    m = m*m ;
    m = m*m ;

    // Gradients:
    //  41 pts uniformly over a line, mapped onto a diamond
    //  The ring size 17*17 = 289 is close to a multiple
    //      of 41 (41*7 = 287)

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    // Normalise gradients implicitly by scaling m
    // Approximation of: m *= inversesqrt(a0*a0 + h*h);
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0+h*h);

    // Compute final noise value at P
    vec3 g = vec3(0.0);
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);
    return 130.0 * dot(m, g);
}

//	<https://www.shadertoy.com/view/4dS3Wd>
//	By Morgan McGuire @morgan3d, http://graphicscodex.com
//
float hash(float n) { return fract(sin(n) * 1e4); }
float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }

float noise(float x) {
	float i = floor(x);
	float f = fract(x);
	float u = f * f * (3.0 - 2.0 * f);
	return mix(hash(i), hash(i + 1.0), u);
}

float noise(vec2 x) {
	vec2 i = floor(x);
	vec2 f = fract(x);

	// Four corners in 2D of a tile
	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));

	// Simple 2D lerp using smoothstep envelope between the values.
	// return vec3(mix(mix(a, b, smoothstep(0.0, 1.0, f.x)),
	//			mix(c, d, smoothstep(0.0, 1.0, f.x)),
	//			smoothstep(0.0, 1.0, f.y)));

	// Same code, with the clamps in smoothstep and common subexpressions
	// optimized away.
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// This one has non-ideal tiling properties that I'm still tuning
float three_noise(vec3 x) {
	const vec3 step = vec3(110, 241, 171);

	vec3 i = floor(x);
	vec3 f = fract(x);
 
	// For performance, compute the base input to a 1D hash from the integer part of the argument and the 
	// incremental change to the 1D based on the 3D -> 1D wrapping
    float n = dot(i, step);

	vec3 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(mix( hash(n + dot(step, vec3(0, 0, 0))), hash(n + dot(step, vec3(1, 0, 0))), u.x),
                   mix( hash(n + dot(step, vec3(0, 1, 0))), hash(n + dot(step, vec3(1, 1, 0))), u.x), u.y),
               mix(mix( hash(n + dot(step, vec3(0, 0, 1))), hash(n + dot(step, vec3(1, 0, 1))), u.x),
                   mix( hash(n + dot(step, vec3(0, 1, 1))), hash(n + dot(step, vec3(1, 1, 1))), u.x), u.y), u.z);
}

float get_height(vec2 pos){
    return snoise(pos/10);
}


float sdPlane( vec3 p, vec4 n )
{
    float height = get_height(p.xz)* abs(cloud_height);
    // n must be normalized
    return dot(p,n.xyz) + n.w+height;
}  

float GetDist(vec3 p)
{
    return sdPlane(p,vec4(0,-1,0,camera_pos.y+sky_height));
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


vec3 GetNormal(vec3 p)
{ 
    float d = GetDist(p); // Distance
    vec2 e = vec2(.001,0); // Epsilon
    vec3 n = d - vec3(
    GetDist(p-e.xyy),  
    GetDist(p-e.yxy),
    GetDist(p-e.yyx));
   
    return normalize(n);
}


float GetLight(vec3 p)
{ 
    // Directional light
    vec3 n = GetNormal(p); // Normal Vector
   
    vec3 u_light_dir = normalize(light_dir);

    float dif = dot(n,u_light_dir); // Diffuse light
    dif = clamp(dif + 0.8,0.,1.); // Clamp so it doesnt go below 0
   
    /*
    // Shadows
    float d = RayMarch(p+n*SURF_DIST*2., l); 

    if(d<length(lightPos-p)) dif *= .1;
 
    */
    return dif;
}

float getTransparency(vec3 p){
    return clamp(0,0.5- clamp(0,get_height(p.xz),0.5)+three_noise(p)*exp(density+1),1);
}

in vec2 uv;
in vec2 adapted_uv;
out vec4 color;
void main()
{
    float depth = texture2D(dtex, adapted_uv).r;
    if (depth < 0.9999){
        color = texture2D(tex, adapted_uv);
        return;
    }
    vec4 background = texture2D(background_tex, adapted_uv);
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

    float d = clamp(0,RayMarch(ro,rd),MAX_DIST); // Distance
    vec3 p = ro + rd * d;

    vec3 l = vec3(GetLight(p)); // Light

    float t = getTransparency(p);

    d /= MAX_DIST;

    if (d > threshold || d < 0 || get_height(p.xz) < density){
        color = background;
        return;
    }
    color = mix(vec4(vec3(l),1),background,t);
}