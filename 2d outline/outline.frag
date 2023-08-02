#version 430

in vec2 uv;
in vec2 offset;
uniform vec4 outline_color;
uniform sampler2D p3d_Texture0;
out vec4 fragColor;
void main()
{
    //compute the new uv coordinate
    vec2 new_uv = uv*(vec2(1)+offset*2) - offset ;

    // Get the color of the pixel at the current UV coordinate
    vec3 color = texture(p3d_Texture0, new_uv).rgb;
    float alpha = texture(p3d_Texture0, new_uv).a;
    
    if (alpha == 0.0 || new_uv.x < 0.0 || new_uv.x > 1.0 || new_uv.y < 0.0 || new_uv.y > 1.0) {
        color = outline_color.rgb;

        // Get the color of the pixel at the current UV coordinate + outline_thickness
        float alpha_r = texture(p3d_Texture0, new_uv + vec2(offset.x,0)).a;

        // If the alpha of the pixel at the current UV coordinate + outline_thickness is 0, then we are on the outline
        if (alpha_r != 0.0) {
            alpha = 1.0;
        }

        float alpha_l = texture(p3d_Texture0, new_uv + vec2(-offset.x,0)).a;
        if (alpha_l != 0.0) {
            alpha = 1.0;
        }

        float alpha_u = texture(p3d_Texture0, new_uv + vec2(0,offset.y)).a;
        if (alpha_u != 0.0) {
            alpha = 1.0;
        }

        float alpha_d = texture(p3d_Texture0, new_uv + vec2(0,-offset.y)).a;
        if (alpha_d != 0.0) {
            alpha = 1.0;
        }
    }


    // Output to screen
    fragColor =  vec4(color,alpha);
}