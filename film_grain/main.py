from ursina import *

app = Ursina()

#Create a shader that will be used to apply the film grain effect
film_grain_shader = Shader(language=Shader.GLSL, fragment='''
#version 140
in vec2 uv;
uniform sampler2D tex;
uniform float osg_FrameTime;
uniform float aspect_ratio;
uniform float resolution;
out vec4 color;

void main()
{
    vec4 base_color = texture(tex, uv);
    
    float strength = 32.0;
    
    float x = (int(uv.x*resolution*aspect_ratio) + 4.0 ) * (int(uv.y*resolution) + 4.0 ) * (mod(osg_FrameTime*10,1) );
    vec4 grain = vec4(mod((mod(x, 13.0) + 1.0) * (mod(x, 123.0) + 1.0), 0.01)-0.005) * strength;
    
    grain = 1.0 - grain;
    color = base_color * grain;
}
''',default_input={
    'aspect_ratio': camera.aspect_ratio,
    'resolution': 300
})

#Create a button that will be used to toggle the film grain effect
button = Button(text='Film Grain', color=color.azure, scale=(0.125, 0.075), position=(-0.5, 0.4))

#Create a scene so that we can apply the film grain effect to it
scene = Entity()
Entity(model='cube', texture='brick', position=(0, 0, 2), parent=scene)
Entity(model='cube', texture='brick', position=(0, 0, 0), parent=scene)
Entity(model='cube', texture='brick', position=(0, 0, -2), parent=scene)

EditorCamera()

camera.shader = film_grain_shader

def button_click():
    if camera.shader == film_grain_shader:
        camera.shader = None
    else:
        camera.shader = film_grain_shader

button.on_click = button_click
app.run()