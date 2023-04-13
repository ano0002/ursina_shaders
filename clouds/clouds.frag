#version 430
float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+10.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec2 fade(vec2 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise
float cnoise(vec2 P)
{
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod289(Pi); // To avoid truncation effects in permutation
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;

    vec4 i = permute(permute(ix) + iy);

    vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0 ;
    vec4 gy = abs(gx) - 0.5 ;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;

    vec2 g00 = vec2(gx.x,gy.x);
    vec2 g10 = vec2(gx.y,gy.y);
    vec2 g01 = vec2(gx.z,gy.z);
    vec2 g11 = vec2(gx.w,gy.w);

    vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
    g00 *= norm.x;  
    g01 *= norm.y;  
    g10 *= norm.z;  
    g11 *= norm.w;  

    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));

    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
}

struct Elipse {
    vec3 center;
    float major_axis;
    float minor_axis;
};

bool is_in_elipse(vec2 point, Elipse e) { 
    float x = point.x - e.center.x;
    float y = point.y - e.center.y;
    float a = e.major_axis;
    float b = e.minor_axis;
    return (x*x)/(a*a) + (y*y)/(b*b) <= 1.0;
}

float better_noise(vec2 uv, int resolution){
    float n = cnoise(uv);
    for (int i=0; i<resolution; i++){
        n += pow(0.5,i)*cnoise(uv*pow(2,i));
    }    
    return n;
}

float distance_ellipse(vec2 point, Elipse e) {
    float distance_x = point.x - e.center.x;
    float distance_y = point.y - e.center.y;
    float ratio = e.minor_axis/e.major_axis;
    return sqrt(distance_x*distance_x*ratio*ratio + distance_y*distance_y)*1/e.major_axis*2;
}

vec2 to_camera_space(vec3 point, vec3 camera_pos, vec3 camera_rot) {
    vec3 camera_direction = normalize(camera_pos);
    vec3 camera_right = normalize(cross(camera_direction, vec3(0,1,0)));
    vec3 camera_up = normalize(cross(camera_right, camera_direction));
    vec3 point_camera_space = point - camera_pos;
    float x = dot(point_camera_space, camera_right);
    float y = dot(point_camera_space, camera_up);
    float z = dot(point_camera_space, camera_direction);
    return vec2(x/z, y/z);
}

uniform sampler2D dtex;
uniform sampler2D tex;
uniform sampler2D background;
uniform float osg_FrameTime;
uniform vec3 camera_pos;
uniform vec3 camera_rot;
uniform mat4 p3d_ModelViewProjectionMatrix;
in vec2 uv;
out vec4 color;
void main() {
    int resolution = 32;
    vec4 depth = texture(dtex, uv);

    Elipse e;
    e.center = vec3(1, 1, 0.0);
    e.major_axis = 0.2;
    e.minor_axis = 0.1;


    if (depth == vec4(1)) {
        /*
        if (is_in_elipse(uv, e)) {
            vec4 background_color = texture(background, uv);
            vec4 noise_color = vec4(better_noise(uv,resolution));
            float ratio = 1-distance_ellipse(uv, e);
            color = mix(background_color, noise_color, ratio);
        }
        else {
            color = texture(background, uv);
        }
        */
        if (to_camera_space(e.center, camera_pos, camera_rot)== uv) {
            color = vec4(1,0,0,1);
        }
        else {
            color = vec4(0,0,0,1);
        }
    }
    else {
        color = texture(tex, uv);
    }
}