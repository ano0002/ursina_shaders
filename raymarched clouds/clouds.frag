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

const float M_PI = 3.1415926535897932384626433832795;

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

mat3 rotationMatrix(vec3 axis, float angle){
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat3(
        oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c
    );
}

float beerLambert(float density, float dist){
    return exp(-dist * density);
}

float henveyGreenstein(float g, float cos_theta){
    float g2 = g * g;
    float denom = 1.0 + g2 - 2.0 * g * cos_theta;
    return (1.0 - g2) / (4.0 * M_PI * pow(denom, 1.5));
}

struct rounded_box{
    vec3 center;
    vec3 size;
    float radius;
};

float rounded_box_sdf(vec3 p, rounded_box b){
    vec3 d = abs(p - b.center) - b.size + vec3(b.radius);
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0)) - b.radius;
}

vec2 lightRayMarch(vec3 origin, vec3 direction, float maxDistance, float resolution){
    float dist = 0.0;
    bool hit = false;
    float hit_pos = 0.0;
    float hit_dist = 0.0;
    rounded_box b = rounded_box(vec3(0, 0, 0), vec3(5), 0.4);
    float max_object_depth = 35;
    float current_step = 0;
    while (current_step < resolution){
        vec3 p = origin + direction * dist;
        float d = rounded_box_sdf(p, b);
        if(d < 0.001){
            if (hit==false){
                hit = true;
                hit_pos = dist;
            }
            else{
                hit_dist += max_object_depth/(resolution-current_step) * noise(p*3.0+wind_direction*osg_FrameTime);
            }
        }
        else{
            if (hit==true){
                break;
            }
        }
        if (hit==false){
            dist += d;

        }
        else{
            dist += max_object_depth/(resolution-current_step);// * noise(p*10.0);
        }
        current_step += 1;
        
    }
    return vec2(hit, hit_dist);
}

vec3 rayMarch(vec3 origin, vec3 direction, float maxDistance, float resolution){
    float dist = 0.0;
    bool hit = false;
    float hit_pos = 0.0;
    float hit_dist = 0.0;
    rounded_box b = rounded_box(vec3(0, 0, 0), vec3(5), 0.4);
    float max_object_depth = 35;
    float current_step = 0;
    float total_light = 0.0;
    while (current_step < resolution){
        vec3 p = origin + direction * dist;
        float d = rounded_box_sdf(p, b);
        if(d < 0.001){
            if (hit==false){
                hit = true;
                hit_pos = dist;
            }
            else{
                hit_dist += max_object_depth/(resolution-current_step) * (0.5+0.5*noise(p*3.0+wind_direction*osg_FrameTime));
                vec2 ray = lightRayMarch(p,normalize(light_position - p), 3.0, 5.0);
                if (ray.x == 1.0){
                    total_light += beerLambert(0.1, ray.y);
                }
            }
        }
        else{
            if (hit==true){
                break;
            }
        }
        if (hit==false){
            dist += d;

        }
        else{
            dist += max_object_depth/(resolution-current_step);// * noise(p*10.0);
        }
        current_step += 1;
        
    }
    return vec3(hit, hit_dist, total_light);
}


in vec2 uv;
out vec4 fragColor;
void main() {
    vec2 new_uv = uv * 2.0 - 1.0;
    new_uv.x *= aspect_ratio;

    vec4 background = texture2D(tex,uv);

    vec3 direction_new = camera_direction;

    vec3 up = p3d_NormalMatrix * vec3(0, 1, 0);
    vec3 right = normalize(cross(direction_new, up));

    vec3 direction = normalize(direction_new)+new_uv.x*right+new_uv.y*-up;
    vec3 origin = camera_position;
    vec3 hit = rayMarch(origin, direction, 90.0, 100.0);
    if(hit.x == 0.0){
        fragColor = background;
        return;
    }
    float depth = hit.y;
    float total_light = hit.z;
    float transparency = beerLambert(density, depth);
    fragColor = mix(vec4(vec3(total_light),1),background, transparency);
}