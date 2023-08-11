#version 430

uniform float aspect_ratio;
uniform vec3 camera_up;
uniform vec3 camera_right;
uniform vec3 camera_forward;
uniform vec3 camera_pos;

uniform vec2 window_size;

uniform float cloud_height;
uniform float cloud_scale;
uniform float density;
uniform float sky_height;
uniform sampler2D background_tex;

uniform vec2 wind_speed;

uniform vec3 light_dir;
uniform vec3 light_color;
uniform float ambient_strength;

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

float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float three_noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

float get_height(vec2 pos){
    return snoise(pos/cloud_scale-wind_speed*osg_FrameTime);
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


vec3 GetLight(vec3 p)
{ 
    //Ambient light
    vec3 dif = light_color * ambient_strength;

    // Directional light
    vec3 n = GetNormal(p); // Normal Vector
   
    vec3 u_light_dir = normalize(light_dir.xzy*vec3(-1,-1,1));


    float brightness = dot(n, u_light_dir);
    brightness = clamp(brightness, 0, 1);

    dif += light_color * brightness;

    /*
    // Shadows
    float d = RayMarch(p+n*SURF_DIST*2., l); 

    if(d<length(lightPos-p)) dif *= .1;
 
    */
    return dif;
}

float getTransparency(vec3 p){
    return clamp(0,0.5- clamp(0,get_height(p.xz),0.5)+three_noise(p/cloud_scale)*exp(density+1),1);
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

    vec3 rd = normalize(camera_right*uv.x+camera_up*uv.y+camera_forward);

    float d = clamp(0,RayMarch(ro,rd),MAX_DIST); // Distance
    vec3 p = ro + rd * d;

    vec3 l = GetLight(p); // Light

    float t = getTransparency(p);

    d /= MAX_DIST;

    if (d > threshold || d < 0 || get_height(p.xz) < density){
        color = background;
        return;
    }
    color = mix(vec4(l,1),background,t);
}