#version 430

vec4 getAdaptedColor(sampler2D tex, vec2 new_uv){
    if (new_uv.x < 0.0 || new_uv.x > 1.0 || new_uv.y < 0.0 || new_uv.y > 1.0){
        return vec4(0.0,0.0,0.0,0.0);
    }
    return texture(tex, new_uv);

}
uniform float BLOOM_THRESHOLD = 0.7;
uniform float BLOOM_INTENSITY = 3.0;

uniform int BLUR_ITERATIONS = 3;
uniform float BLUR_SIZE = 0.03;
uniform int BLUR_SUBDIVISIONS = 32;


vec3 getHDR(vec3 tex) {
    return max((tex - BLOOM_THRESHOLD) * BLOOM_INTENSITY, vec3(0.0));
}

vec3 gaussian(sampler2D sampler, vec2 uv) {
    vec3 sum = vec3(0.0);

    for (int i = 1; i <= BLUR_ITERATIONS; i++) {
        float angle = 360.0 / float(BLUR_SUBDIVISIONS);

        for (int j = 0; j < BLUR_SUBDIVISIONS; j++) {
            float dist = BLUR_SIZE * float(i + 1) / float(BLUR_ITERATIONS);
            float s = sin(angle * float(j));
            float c = cos(angle * float(j));

            sum += getHDR(getAdaptedColor(sampler, uv + vec2(c, s) * dist).xyz);
        }
    }

    sum /= float(BLUR_ITERATIONS * BLUR_SUBDIVISIONS);
    return sum * BLOOM_INTENSITY;
}

vec3 blend(vec3 a, vec3 b) {
    return 1.0 - (1.0 - a) * (1.0 - b);
}

in vec2 uv;
in vec2 offset;
uniform sampler2D p3d_Texture0;
out vec4 fragColor;
void main()
{
    //compute the new uv coordinate
    vec2 new_uv = uv*(vec2(1)+offset*2) - offset ;
    
    vec4 tx = getAdaptedColor(p3d_Texture0, new_uv);
    vec3 result = gaussian(p3d_Texture0, new_uv);

	vec4 bg = vec4(result, 1);

    float gray = dot(bg.rgb, vec3(0.299, 0.587, 0.114));
    bg = vec4(bg.rgb, gray);

	vec4 final = bg;

	final = bg + tx;

    fragColor = final;
}