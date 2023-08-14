#version 430

uniform sampler2D tex;
uniform float osg_FrameTime;

uniform sampler2D noise;

uniform vec3 camera_p;
uniform vec3 camera_f;
uniform vec3 camera_r;
uniform vec3 camera_u;
uniform float aspect_ratio;

uniform vec3 drop_size;
uniform vec3 drops_color;

const float kPI = 3.141592654;

struct C_Ray
{
    vec3 vOrigin;
    vec3 vDir;
};
C_Ray ray;

float Raymarch( const in C_Ray ray )
{        
    float fDistance = .1;
    bool hit = false;
    for(int i=0;i < 50; i++)
    {
			float fSceneDist = MapToScene( ray.vOrigin + ray.vDir * fDistance );
			if(fSceneDist <= 0.01 || fDistance >= 150.0)
			{
				hit = true;
                break;
			} 

        	fDistance = fDistance + fSceneDist;
	}
	
	return fDistance;
}

in vec2 uv;
out vec4 fragColor;
void main() {

    vec2 new_uv = uv * 2.0 - 1.0;
    new_uv.x *= aspect_ratio;

    vec3 color = texture(tex, uv).rgb;

    vec3 ro = camera_p;
    vec3 rd = normalize(camera_f + camera_r * (uv.x - 0.5) + camera_u * (uv.y - 0.5));

    float t = rayMarch(ro, rd);

	// Twelve layers of rain sheets...
	vec2 q = uv
	float dis = 1.;
	for (int i = 0; i < 12; i++)
	{
		vec3 plane = vCameraPos + originalRayDir * dis;
		//plane.z -= (texture(iChannel3, q*iTime).x*3.5);
		if (plane.z < vHitPos.z)
		{
			float f = pow(dis, .45)+.25;

			vec2 st =  f * (q * vec2(1.5, .05)+vec2(-iTime*.1+q.y*.5, iTime*.12));
			f = (texture(noise, st * .5, -99.0).x + texture(noise, st*.284, -99.0).y);
			f = clamp(pow(abs(f)*.5, 29.0) * 140.0, 0.00, q.y*.4+.05);

			vec3 bri = vec3(.25);
			for (int t = 0; t < NUM_LIGHTS; t++)
			{
				vec3 v3 = lightArray[t].xyz - plane.xyz;
				float l = dot(v3, v3);
				l = max(3.0-(l*l * .02), 0.0);
				bri += l * lightColours[t];
				
			}
			col += bri*f;
		}
		dis += 3.5;
	}
	col = clamp(col, 0.0, 1.0);
			
    if(t > 0.0) {
        color = drops_color;
    }

    fragColor =vec4(color,1);

}