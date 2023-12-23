#version 430

uniform sampler2D tex;
uniform sampler2D dtex;
uniform float outline_size;
uniform float aspect_ratio;
in vec2 uv;
out vec4 color;
mat3 sobel_y = mat3( 
     1.0, 0.0, -1.0, 
     2.0, 0.0, -2.0, 
     1.0, 0.0, -1.0 
);

mat3 sobel_x = mat3( 
     1.0, 2.0, 1.0, 
     0.0, 0.0, 0.0, 
    -1.0, -2.0, -1.0 
);
void main () {
    vec3 rgbcolor = texture(tex, uv).rgb;
    mat3 I;
    vec3 texel;
    for (int i=0; i<3; i++) {
        for (int j=0; j<3; j++) {
            vec2 new_uv = uv + vec2(float(i-1)*outline_size/aspect_ratio, float(j-1)*outline_size);
            new_uv = clamp(new_uv, vec2(0.0), vec2(1.0));
            float depth = texture(dtex, new_uv).r;
            I[i][j] = depth; 
        }
    }

    float gx = dot(sobel_x[0], I[0]) + dot(sobel_x[1], I[1]) + dot(sobel_x[2], I[2]); 
    float gy = dot(sobel_y[0], I[0]) + dot(sobel_y[1], I[1]) + dot(sobel_y[2], I[2]);


    if (0.01 < abs(gx)+abs(gy)) {
        rgbcolor = vec3(0.0);
    }

    color = vec4(rgbcolor, 1.0);
}