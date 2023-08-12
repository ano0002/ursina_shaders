#version 430

uniform sampler2D tex;
uniform float osg_FrameTime;
uniform vec2 pixel_size;
uniform vec2 resolution;
uniform float palette_size;
uniform float spread;
uniform float gamma_correction;

vec3 dithering(vec3 color,vec2 uv){
    mat4 dither_matrix = mat4(0, 8, 2, 10, 
                              12, 4, 14, 6,
                              3, 11, 1, 9,
                              15, 7, 13, 5) * 0.0625;
     
    vec2 xy = (uv*resolution) % 4;
    float dither = dither_matrix[int(xy.x)][int(xy.y)];
    color = clamp(color + spread * dither-1/2, 0.0, 1.0);
    return color;
}

vec3 getColor(vec2 adapted_uv,vec2 uv){
    return dithering(texture(tex, adapted_uv).rgb,adapted_uv);
}

in vec2 uv;
out vec4 fragColor;
void main() {
    vec2 offset = uv % (pixel_size* 1/resolution); 
    
    vec2 adapted_uv = uv - offset;


    vec3 color = getColor(adapted_uv,uv);


    //Applying color pallette
    color = floor(color*(palette_size-1)+0.5)/(palette_size-1);
    

    fragColor =vec4(color,1);

}