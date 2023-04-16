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
    vec2 center;
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
    float ratio = e.major_axis/e.minor_axis;
    return sqrt(distance_x*distance_x*ratio + distance_y*distance_y)/(e.major_axis*2);
}

vec3 rotateX(vec3 position,float angle){
    float s = sin(angle);
    float c = cos(angle);
    mat3 m = mat3(
        1,0,0,
        0,c,-s,
        0,s,c
    );
    return m*position;
}

vec3 rotateY(vec3 position,float angle){
    float s = sin(angle);
    float c = cos(angle);
    mat3 m = mat3(
        c,0,s,
        0,1,0,
        -s,0,c
    );
    return m*position;
}

vec3 rotateZ(vec3 position,float angle){
    float s = sin(angle);
    float c = cos(angle);
    mat3 m = mat3(
        c,-s,0,
        s,c,0,
        0,0,1
    );
    return m*position;
}


vec3 rotate(vec3 position,vec3 rotation){
    vec3 p = position;
    p = rotateX(p,rotation.x);
    p = rotateY(p,rotation.y);
    p = rotateZ(p,rotation.z);
    return p;
}
vec3 get_camera_normal(vec3 camera_rot,vec3 camera_pos){
    vec3 camera_normal = vec3(0,0,1);
    camera_normal = rotate(camera_normal,camera_rot);
    return camera_normal;
}

vec3[2] get_camera_vectors(vec3 camera_rot,vec3 camera_pos){
    vec3 camera_normal = get_camera_normal(camera_rot, camera_pos);
    vec3 camera_up = vec3(0,1,0);
    camera_up = rotate(camera_up,camera_rot);
    vec3 camera_right = cross(camera_normal,camera_up);
    return vec3[2](camera_right,camera_up);
}

mat3 inverse(mat3 m) {
  float a11 = m[0][0], a12 = m[0][1], a13 = m[0][2];
  float a21 = m[1][0], a22 = m[1][1], a23 = m[1][2];
  float a31 = m[2][0], a32 = m[2][1], a33 = m[2][2];

  float b00 = a22 * a33 - a23 * a32;
  float b01 = a13 * a32 - a12 * a33;
  float b02 = a12 * a23 - a13 * a22;
  float b10 = a23 * a31 - a21 * a33;
  float b11 = a11 * a33 - a13 * a31;
  float b12 = a13 * a21 - a11 * a23;
  float b20 = a21 * a32 - a22 * a31;
  float b21 = a12 * a31 - a11 * a32;
  float b22 = a11 * a22 - a12 * a21;

  float det = a11 * b00 + a12 * b10 + a13 * b20;

  if (det == 0.0) {
    return mat3(1.0); // Matrix is singular, return identity matrix
  }

  mat3 inv;
  inv = mat3(b00, b01, b02, b10, b11, b12, b20, b21, b22) / det;

  return inv;
}


vec2 computeNDCCoordinates(
    vec3 pWorld,
    mat3 p3d_ModelViewProjectionMatrix,
    vec3 camera_pos )
{  
    vec3 pCamera = p3d_ModelViewProjectionMatrix * (pWorld - camera_pos);
    vec2 pNDC = pCamera.xy / pCamera.z;
    return pNDC;
}

uniform sampler2D dtex;
uniform sampler2D tex;
uniform sampler2D background;
uniform float osg_FrameTime;
uniform vec3 camera_pos;
uniform vec3 camera_rot;
uniform float camera_fov;
in vec2 uv;
in vec2 window_size;
out vec4 color;
void main() {
    int resolution = 32;
    vec4 depth = texture(dtex, uv);

    vec3 cloud_pos = vec3(1,1,1);


    if (depth == vec4(1)) {
        vec3 rad_camera_rot = vec3(radians(camera_rot.x),radians(camera_rot.y),radians(camera_rot.z));

        vec3 camera_normal = get_camera_normal(rad_camera_rot,camera_pos);
        vec3[2] camera_vectors = get_camera_vectors(rad_camera_rot,camera_pos);
        mat3 camera_matrix = mat3(camera_vectors[0],camera_vectors[1],camera_normal);
        mat3 camera_matrix_inv = inverse(camera_matrix);

        vec2 cloud_uv = computeNDCCoordinates(cloud_pos,camera_matrix_inv,camera_pos);
        /*
        float cloud_radius = 0.1;
        if (distance(cloud_uv,uv)<cloud_radius) {
            Elipse e;
            e.center = cloud_uv;
            e.major_axis = 0.2;
            e.minor_axis = 0.1;
            vec4 background_color = vec4(0.0, 0.0, 1.0,1.0);//texture(background, uv);
            //vec4 noise_color = vec4(vec3(better_noise(uv,resolution)),1.0);
            float ratio = 1-distance_ellipse(uv, e);

            color = mix(background_color, vec4(1.0), better_noise(uv,resolution)*ratio);
        }
        else {
            color = vec4(0.0, 0.0, 1.0,1.0);//texture(background, uv);
        }
        */
        color = vec4(cloud_uv*10,0.0,1.0);


    }
    else {
        color = texture(tex, uv);
    }
}