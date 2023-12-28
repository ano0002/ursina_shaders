#version 430

uniform float thickness;
uniform float density;
uniform vec4 vein_color;

float rand(vec2 n) { 
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float rand(float n){return fract(sin(n) * 43758.5453123);}

float noise(float p){
    float fl = floor(p);
    float fc = fract(p);
    return mix(rand(fl), rand(fl + 1.0), fc);
}

float noise(vec2 n) {
    const vec2 d = vec2(0.0, 1.0);
    vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
    return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

float getLine(vec2 uv, vec2 offset)
{
    //rot = radians(rot);
    uv *= 20.;
    uv += offset;
    float n = noise(uv*vec2(.9, .4));
    uv.y += n - .4;

    float col = smoothstep(thickness, -.15, abs(uv.y));
        
    return col;
}

vec4 getVein(vec2 uv)
{
    
    float f = 0.;
    
    for(float i = 0.; i < 65.; i += 0.9)
    {
        f += getLine(uv, vec2(.5 + i, (noise(i) * 35. - 25.)*density));
    }
    
    f = min(f, 1.);
    if(f < .1) return vec4(0);
    return vein_color;
}

in vec2 uv;
out vec4 color;
void main()
{
    // Normalized pixel coordinates (from 0 to 1)
    
    color = getVein(uv) ;

}