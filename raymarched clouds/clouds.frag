#version 430

uniform mat3 p3d_NormalMatrix;
uniform mat3 p3d_NormalMatrixInverse;
uniform sampler2D tex;
uniform float osg_FrameTime;
uniform float density;
uniform vec3 light_direction;
uniform vec3 light_position;
uniform vec3 light_color;
uniform vec3 camera_direction;
uniform vec3 camera_position;
uniform float aspect_ratio;
uniform vec3 wind_direction;

float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float two_noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);
	
	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}

float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
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

float map5( in vec3 p )
{    
    vec3 q = p - vec3(0.0,0.1,1.0)*osg_FrameTime;    
    float f;
    f  = 0.50000*noise( q ); q = q*2.02;    
    f += 0.25000*noise( q ); q = q*2.03;    
    f += 0.12500*noise( q ); q = q*2.01;    
    f += 0.06250*noise( q ); q = q*2.02;    
    f += 0.03125*noise( q );    
    return clamp( 1.5 - p.y - 2.0 + 1.75*f, 0.0, 1.0 );
}
float map4( in vec3 p )
{    
    vec3 q = p - vec3(0.0,0.1,1.0)*osg_FrameTime;    
    float f;
    f  = 0.50000*noise( q ); q = q*2.02;    
    f += 0.25000*noise( q ); q = q*2.03;    
    f += 0.12500*noise( q ); q = q*2.01;   
    f += 0.06250*noise( q );    
    return clamp( 1.5 - p.y - 2.0 + 1.75*f, 0.0, 1.0 );
}
float map3( in vec3 p )
{
    vec3 q = p - vec3(0.0,0.1,1.0)*osg_FrameTime;    
    float f;
    f  = 0.50000*noise( q ); q = q*2.02;    
    f += 0.25000*noise( q ); q = q*2.03;    f += 0.12500*noise( q );    
    return clamp( 1.5 - p.y - 2.0 + 1.75*f, 0.0, 1.0 );
}
float map2( in vec3 p )
{    
    vec3 q = p - vec3(0.0,0.1,1.0)*osg_FrameTime;    
    float f;
    f  = 0.50000*noise( q ); 
    q = q*2.02;    f += 0.25000*noise( q );;    
    return clamp( 1.5 - p.y - 2.0 + 1.75*f, 0.0, 1.0 );
}

const vec3 sundir = light_direction;

#define MARCH(STEPS,MAPLOD) for(int i=0; i<STEPS; i++) { vec3 pos = ro + t*rd; if( pos.y<-3.0 || pos.y>2.0 || sum.a>0.99 ) break; float den = MAPLOD( pos ); if( den>0.01 ) { float dif = clamp((den - MAPLOD(pos+0.3*sundir))/0.6, 0.0, 1.0 ); vec3  lin = vec3(1.0,0.6,0.3)*dif+vec3(0.91,0.98,1.05); vec4  col = vec4( mix( vec3(1.0,0.95,0.8), vec3(0.25,0.3,0.35), den ), den ); col.xyz *= lin; col.xyz = mix( col.xyz, bgcol, 1.0-exp(-0.003*t*t) ); col.w *= 0.4; col.rgb *= col.a; sum += col*(1.0-sum.a); } t += max(0.06,0.05*t); }

vec4 raymarch( in vec3 ro, in vec3 rd, in vec3 bgcol, in ivec2 px )
{    
    vec4 sum = vec4(0.0);    
    float t = 0.05*two_noise(px&255).x;    
    MARCH(40,map5);    
    MARCH(40,map4);    
    MARCH(30,map3);    
    MARCH(30,map2);    
    return clamp( sum, 0.0, 1.0 );
}

vec4 render( in vec3 ro, in vec3 rd, in ivec2 px , in vec2 uv)
{
    // background sky         
    vec3 col = texture2D(tex,uv).rgb;
    // clouds        
    vec4 res = raymarch( ro, rd, col, px );    
    col = col*(1.0-res.w) + res.xyz;

    return vec4( col, 1.0 );
}

out vec4 fragColor ;
in vec2 uv;
void main()
{
    vec2 p = uv * 2.0 - 1.0;

    // camera
    vec3 ro = camera_direction;
	vec3 ta = vec3(0.0, 5.0, 0.0);
    mat3 ca = p3d_NormalMatrix;
    // ray
    vec3 rd = ca * normalize( vec3(p.xy,1.5));
    
    fragColor = render( ro, rd, ivec2(uv-0.5) ,uv);
}
