from ursina import *

app = Ursina()

fire = Entity(model='cube', texture = "brick")

fire_shader = Shader(fragment='''
#version 430
                      
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
            -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

in vec2 uv;
uniform sampler2D p3d_Texture0;
uniform float iTime;
uniform float resolution;
uniform float distorsion;
out vec4 fragColor;
void main()
{
    vec4 color = texture(p3d_Texture0, uv);
    float red1 = snoise(uv*resolution+iTime*0.2);
    vec3 col = vec3(1,0,0)*abs(red1)*(-uv.y*0.4);
    float red2 = snoise(uv*resolution-iTime*0.3);
    col += vec3(1,0,0)*abs(red2)*(-uv.y*0.4);
    float yellow1 = snoise(uv*resolution-iTime*0.1);
    col += vec3(1,1,0)*abs(yellow1)*(-uv.y*0.2);
    
    float brightness = col.x + col.y + col.z;
    float threshold = 0.8;
    if (brightness > 2*threshold){
        col = vec3(1);
    }
    color = mix(vec4(col,1),color,0.5);
    // Output to screen
    fragColor = color;
}''')

fire.shader = fire_shader

start = time.time()

fire.set_shader_input("iTime",0)
fire.set_shader_input("resolution",4)

def update():
    fire.set_shader_input("iTime", time.time()-start)

EditorCamera()

app.run()