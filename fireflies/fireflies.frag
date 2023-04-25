#version 430

uniform sampler2D tex;
uniform vec4 fireflies_color;
uniform vec2 points[100];
uniform vec3 camera_position;
uniform float fireflies_size;
in vec2 uv;
uniform vec2 window_size;
out vec4 color;
void main() {
    float aspect = window_size.x/window_size.y;
    vec2 new_uv = uv-camera_position.xy/camera_position.z*2;
    new_uv.x *= aspect;
    for (int i = 0; i < 100; i++) {
        vec2 point1 = points[i];
        float d = distance(point1,new_uv);
        if (d < fireflies_size) {
            color = mix(fireflies_color, texture(tex, uv), d*(1/fireflies_size));
            return;
        }
    }
    color = texture(tex, uv);
}